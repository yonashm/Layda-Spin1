import React, { useRef, useEffect, useState } from 'react';
import { WheelEntry, WheelSettings } from '../types';
import { audioSynth } from '../utils/audio';

interface WheelCanvasProps {
  entries: WheelEntry[];
  colors: string[];
  settings: WheelSettings;
  onSpinComplete: (winner: WheelEntry) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  entries,
  colors,
  settings,
  onSpinComplete,
  isSpinning,
  setIsSpinning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pointerBounce, setPointerBounce] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  // Refs to track rotation state for animation loop
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const startRotationRef = useRef(0);
  const spinStartTimeRef = useRef(0);
  const lastTickSegmentRef = useRef(-1);

  // Resize observer to handle container size fluidly
  useEffect(() => {
    const handleResize = () => {
      const parent = canvasRef.current?.parentElement;
      if (parent) {
        const size = Math.min(parent.clientWidth - 32, 500);
        setDimensions({ width: size, height: size });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalWeight = entries.reduce((sum, entry) => sum + (settings.weightedMode ? entry.weight : 1), 0);

  // Draw function
  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 24;

    ctx.clearRect(0, 0, width, height);

    if (entries.length === 0) {
      // Draw placeholder empty circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = settings.themeMode === 'dark' ? '#1f2937' : '#f3f4f6';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#9ca3af';
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add some entries to spin!', centerX, centerY);
      return;
    }

    const numSlices = entries.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    // Draw Wheel Shadow & Glow
    if (settings.glowEnabled) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.shadowColor = settings.glowColor;
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffffff01';
      ctx.fill();
      ctx.restore();
    }

    // Draw segments
    entries.forEach((entry, i) => {
      const startAngle = i * sliceAngle + rotation;
      const endAngle = startAngle + sliceAngle;
      const baseColor = entry.color || colors[i % colors.length] || '#ccc';

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle + settings.sliceSpacing * 0.005, endAngle - settings.sliceSpacing * 0.005);
      ctx.closePath();

      // Create rich linear gradient for metallic SaaS/premium feel
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      grad.addColorStop(0, '#ffffff44'); // brighten center slightly
      grad.addColorStop(0.3, baseColor);
      grad.addColorStop(1, adjustColorBrightness(baseColor, -15)); // darken slightly near border

      ctx.fillStyle = grad;
      ctx.fill();

      // Draw border between slices
      if (settings.sliceBorderWidth > 0) {
        ctx.strokeStyle = settings.sliceBorderColor;
        ctx.lineWidth = settings.sliceBorderWidth;
        ctx.stroke();
      }
      ctx.restore();

      // Draw Text label
      ctx.save();
      ctx.translate(centerX, centerY);
      // Rotate to point in the center of the current slice
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);

      // Label Styling
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = getContrastYIQ(baseColor);

      // Determine responsive font size based on entry text length and slice size
      const maxTextLength = Math.max(...entries.map(e => e.text.length));
      const textRatio = Math.max(0.5, 1 - (entry.text.length / 30));
      const sliceWidthRatio = Math.min(1, sliceAngle / (Math.PI / 4)); // smaller font for tiny slices
      const calculatedFontSize = Math.max(10, Math.floor((radius * 0.1) * textRatio * sliceWidthRatio));

      ctx.font = `${settings.uppercase ? 'bold' : 'medium'} ${calculatedFontSize}px ${settings.fontFamily}, Inter, sans-serif`;

      // Text wrapping / truncation
      let textToDraw = entry.text;
      if (settings.uppercase) {
        textToDraw = textToDraw.toUpperCase();
      }

      // Add small space before the outer boundary
      const textX = radius - 15;

      // Render Text
      ctx.fillText(textToDraw, textX, 0);

      // Draw custom weight indicator if active and weight > 1
      if (settings.weightedMode && entry.weight > 1) {
        ctx.fillStyle = '#ffffff99';
        ctx.font = `bold ${Math.floor(calculatedFontSize * 0.8)}px sans-serif`;
        ctx.fillText(`(x${entry.weight})`, textX - ctx.measureText(textToDraw).width - 8, 0);
      }

      ctx.restore();
    });

    // Draw Outer Rim Border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = settings.sliceBorderColor;
    ctx.lineWidth = settings.sliceBorderWidth + 2;
    ctx.stroke();

    // Draw Outer Bezel decorative dots
    ctx.save();
    const dotsCount = Math.max(24, numSlices * 2);
    for (let d = 0; d < dotsCount; d++) {
      const angle = (Math.PI * 2 / dotsCount) * d + rotation;
      const dotX = centerX + (radius + 6) * Math.cos(angle);
      const dotY = centerY + (radius + 6) * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = settings.themeMode === 'dark' ? '#f59e0b' : '#3b82f6';
      ctx.fill();
    }
    ctx.restore();

    // Draw Premium Center Button/Bezel
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
    const centerGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 42);
    centerGrad.addColorStop(0, '#ffffff');
    centerGrad.addColorStop(0.3, '#f3f4f6');
    centerGrad.addColorStop(0.8, '#d1d5db');
    centerGrad.addColorStop(1, '#9ca3af');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fill();

    // Center rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // SPIN label inside button
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 14px ${settings.fontFamily}, sans-serif`;
    ctx.fillText(settings.centerButtonText.toUpperCase(), centerX, centerY);
    ctx.restore();
  };

  // Helper helper to brighten/darken hex colors
  const adjustColorBrightness = (hex: string, percent: number) => {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = Math.max(0, Math.min(255, R + percent));
    G = Math.max(0, Math.min(255, G + percent));
    B = Math.max(0, Math.min(255, B + percent));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  // Contrast checker for readable text colors
  const getContrastYIQ = (hexcolor: string) => {
    const r = parseInt(hexcolor.substring(1, 3), 16);
    const g = parseInt(hexcolor.substring(3, 5), 16);
    const b = parseInt(hexcolor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 140) ? '#111827' : '#ffffff';
  };

  // Choose winner based on standard equal random OR custom weights
  const selectWinnerIndex = (): number => {
    if (settings.weightedMode) {
      let r = Math.random() * totalWeight;
      for (let i = 0; i < entries.length; i++) {
        const weight = entries[i].weight;
        r -= weight;
        if (r <= 0) return i;
      }
      return 0;
    } else {
      return Math.floor(Math.random() * entries.length);
    }
  };

  // Easing function for realistic spin physics (exponential deceleration)
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  // Animation ticks trigger
  const spinAnimate = (timestamp: number) => {
    if (!spinStartTimeRef.current) spinStartTimeRef.current = timestamp;
    const elapsed = (timestamp - spinStartTimeRef.current) / 1000; // in seconds
    const duration = settings.spinDuration;

    if (elapsed >= duration) {
      // Completed! Stop exactly at target rotation
      rotationRef.current = targetRotationRef.current % (Math.PI * 2);
      drawWheel(rotationRef.current);
      setIsSpinning(false);

      // Determine final selected segment
      const numSlices = entries.length;
      const sliceAngle = (Math.PI * 2) / numSlices;
      // Pointer is at Top (-Math.PI/2, which is 1.5 * Math.PI in positive terms)
      const pointerAngle = 1.5 * Math.PI;
      const currentRot = rotationRef.current % (Math.PI * 2);
      const adjustedPointerAngle = (pointerAngle - currentRot + Math.PI * 2) % (Math.PI * 2);
      const winningIndex = Math.floor(adjustedPointerAngle / sliceAngle) % numSlices;

      const winner = entries[winningIndex];
      onSpinComplete(winner);
      return;
    }

    // Percentage of completion
    const t = elapsed / duration;
    const ease = easeOutExpo(t);

    // Compute current rotation
    const currentRot = startRotationRef.current + (targetRotationRef.current - startRotationRef.current) * ease;
    rotationRef.current = currentRot;

    // Detect ticks as slice divider lines cross pointer at 1.5 * Math.PI
    const numSlices = entries.length;
    const sliceAngle = (Math.PI * 2) / numSlices;
    const pointerAngle = 1.5 * Math.PI;
    const currentRelativeAngle = (pointerAngle - currentRot + Math.PI * 2) % (Math.PI * 2);
    const currentSegment = Math.floor(currentRelativeAngle / sliceAngle);

    if (currentSegment !== lastTickSegmentRef.current) {
      lastTickSegmentRef.current = currentSegment;
      // Trigger tick sound
      if (settings.soundEnabled) {
        audioSynth.playTick(settings.soundTheme, settings.volume);
      }
      // Trigger Pointer wobble
      setPointerBounce(true);
      setTimeout(() => setPointerBounce(false), 80);
    }

    drawWheel(currentRot);
    requestAnimationFrame(spinAnimate);
  };

  const handleSpinClick = () => {
    if (isSpinning || entries.length === 0) return;

    setIsSpinning(true);
    spinStartTimeRef.current = 0;
    startRotationRef.current = rotationRef.current;

    // Choose winner mathematically
    const winIndex = selectWinnerIndex();
    const numSlices = entries.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    // We want the wheel pointer (at 1.5 * Math.PI) to point to the winning index segment.
    // Winning segment is W * sliceAngle to (W + 1) * sliceAngle.
    // Pick a random position within that segment for realism (jitter)
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.7;
    const segmentCenter = (winIndex + 0.5) * sliceAngle;
    const relativeTarget = (1.5 * Math.PI - segmentCenter - jitter + Math.PI * 2) % (Math.PI * 2);

    // Add 6 to 10 full spins for high-speed excitement
    const fullSpins = 6 + Math.floor(Math.random() * 4);
    targetRotationRef.current = startRotationRef.current + relativeTarget + (fullSpins * Math.PI * 2);

    requestAnimationFrame(spinAnimate);
  };

  // Initial draw
  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [entries, colors, settings, dimensions]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Background Glow Container */}
      <div className="relative flex items-center justify-center rounded-full bg-slate-900/5 dark:bg-slate-400/5 p-6 backdrop-blur-md border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="cursor-pointer transition-transform duration-100 hover:scale-[1.01] active:scale-[0.99] z-10"
          onClick={handleSpinClick}
        />

        {/* Realistic Pointer overlay positioned at top (12 o'clock) */}
        <div
          className={`absolute top-1 z-20 transition-transform origin-top`}
          style={{
            transform: `translateX(-50%) ${pointerBounce ? 'rotate(-12deg) scale(1.15)' : 'rotate(0deg)'}`,
            left: '50%',
          }}
        >
          {/* Custom SVG pointer styled beautifully */}
          <svg
            width="40"
            height="50"
            viewBox="0 0 40 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-lg"
          >
            <path
              d="M20 50L40 0H0L20 50Z"
              fill={settings.pointerColor}
            />
            {/* Glossy overlay on pointer */}
            <path
              d="M20 50L30 12.5H10L20 50Z"
              fill="rgba(255,255,255,0.25)"
            />
            <circle
              cx="20"
              cy="6"
              r="4"
              fill="#FFFFFF"
              opacity="0.9"
            />
          </svg>
        </div>
      </div>

      {/* Manual SPIN Button beneath wheel (for great UX/touch) */}
      <button
        id="spin-button"
        onClick={handleSpinClick}
        disabled={isSpinning || entries.length === 0}
        className={`mt-6 px-10 py-4 font-bold text-lg rounded-full tracking-wider shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0
          ${
            isSpinning || entries.length === 0
              ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-600 cursor-not-allowed scale-95 shadow-none'
              : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-blue-500/20 active:scale-95 cursor-pointer animate-pulse'
          }`}
      >
        {isSpinning ? 'SPINNING...' : settings.centerButtonText.toUpperCase()}
      </button>
    </div>
  );
};
