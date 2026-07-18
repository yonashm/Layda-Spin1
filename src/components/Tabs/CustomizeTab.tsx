import React, { useState } from 'react';
import { WheelSettings, TRANSLATIONS, AppLanguage } from '../../types';
import { Sparkles, Palette, Type, Settings, Volume2, Sparkle, LayoutGrid, RefreshCw } from 'lucide-react';

interface CustomizeTabProps {
  settings: WheelSettings;
  setSettings: (settings: WheelSettings) => void;
  colors: string[];
  setColors: (colors: string[]) => void;
  language: AppLanguage;
  isSpinning: boolean;
}

export const CustomizeTab: React.FC<CustomizeTabProps> = ({
  settings,
  setSettings,
  colors,
  setColors,
  language,
  isSpinning,
}) => {
  const [aiThemePrompt, setAiThemePrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const t = TRANSLATIONS[language];

  // Standard preset color palettes for fast picking
  const PRESET_PALETTES = [
    {
      name: t.paletteRetro,
      colors: ['#FF0055', '#00FFCC', '#9900FF', '#FFCC00', '#FF00AA', '#0099FF'],
    },
    {
      name: t.paletteOcean,
      colors: ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e', '#38bdf8'],
    },
    {
      name: t.paletteSunset,
      colors: ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#f97316', '#eab308'],
    },
    {
      name: t.paletteForest,
      colors: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399'],
    },
    {
      name: t.paletteRainbow,
      colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7'],
    }
  ];

  // Update specific setting value
  const updateSetting = <K extends keyof WheelSettings>(key: K, value: WheelSettings[K]) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  // AI Palette Generator from local server Gemini endpoint
  const handleAiPalette = async () => {
    if (!aiThemePrompt.trim() || isSpinning) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiThemePrompt }),
      });
      const data = await res.json();
      if (res.ok && data.colors && Array.isArray(data.colors)) {
        setColors(data.colors);
        setAiThemePrompt('');
      } else {
        setAiError(data.error || 'Failed to generate palette');
      }
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with AI service');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 max-h-[85vh] overflow-y-auto pr-1 custom-scrollbar pb-10">
      
      {/* SECTION 1: COLOR CUSTOMIZER */}
      <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Palette className="w-4 h-4 text-indigo-500" />
          <span>{t.wheelColors}</span>
        </div>

        {/* Dynamic color chip grid */}
        <div className="flex flex-wrap gap-2 py-2">
          {colors.map((color, idx) => (
            <div key={idx} className="relative group">
              <input
                type="color"
                value={color}
                disabled={isSpinning}
                onChange={(e) => {
                  const updated = [...colors];
                  updated[idx] = e.target.value;
                  setColors(updated);
                }}
                className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-800 cursor-pointer overflow-hidden shadow-xs hover:scale-105 transition-all"
              />
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => {
                  if (colors.length <= 2) return;
                  setColors(colors.filter((_, i) => i !== idx));
                }}
                className="absolute -top-1 -right-1 hidden group-hover:flex bg-red-500 text-white w-4 h-4 rounded-full items-center justify-center text-[10px] font-bold shadow-md cursor-pointer hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
          {/* Add custom color slot button */}
          <button
            type="button"
            disabled={isSpinning}
            onClick={() => setColors([...colors, '#6366f1'])}
            className="w-10 h-10 rounded-full border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-500 dark:hover:text-slate-200 transition-all cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Preset list */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {PRESET_PALETTES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSpinning}
              onClick={() => setColors(preset.colors)}
              className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-[11px] font-medium text-left truncate cursor-pointer"
            >
              <div className="flex h-3 w-8 shrink-0 rounded-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                {preset.colors.slice(0, 3).map((col, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: col }} />
                ))}
              </div>
              <span className="truncate dark:text-slate-300">{preset.name}</span>
            </button>
          ))}
        </div>

        {/* AI COLOR GENERATOR */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
            <span>{t.generateAiPalette}</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
            {t.generateAiPaletteDesc}
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={aiThemePrompt}
              onChange={(e) => setAiThemePrompt(e.target.value)}
              disabled={aiLoading || isSpinning}
              placeholder={t.aiPromptPlaceholder}
              className="flex-1 px-2.5 py-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAiPalette}
              disabled={aiLoading || !aiThemePrompt.trim() || isSpinning}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all duration-300 shrink-0
                ${
                  aiThemePrompt.trim() && !aiLoading
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/15'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent dark:border-slate-800'
                }`}
            >
              {aiLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          {aiError && (
            <p className="text-[10px] text-red-500 leading-tight mt-0.5">{aiError}</p>
          )}
        </div>
      </div>

      {/* SECTION 2: TYPOGRAPHY */}
      <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Type className="w-4 h-4 text-indigo-500" />
          <span>{t.appearance}</span>
        </div>

        {/* Font Family selection */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.fontFamilyLabel}
          </label>
          <select
            value={settings.fontFamily}
            disabled={isSpinning}
            onChange={(e) => updateSetting('fontFamily', e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-200"
          >
            <option value="Inter">Inter (Sans-serif)</option>
            <option value="Space Grotesk">Space Grotesk (Tech/Modern)</option>
            <option value="Outfit">Outfit (Geometric/Elegant)</option>
            <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
          </select>
        </div>

        {/* Capitalize Toggle */}
        <div className="flex items-center justify-between py-1 border-t border-slate-200 dark:border-slate-800/60 mt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.uppercaseLabel}</span>
          <input
            type="checkbox"
            checked={settings.uppercase}
            disabled={isSpinning}
            onChange={(e) => updateSetting('uppercase', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* SECTION 3: WHEEL SETTINGS (radius, gaps, pointers) */}
      <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Settings className="w-4 h-4 text-indigo-500" />
          <span>{t.settings}</span>
        </div>

        {/* Spin duration slider */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{t.spinDurationLabel}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{settings.spinDuration}s</span>
          </div>
          <input
            type="range"
            min="5"
            max="12"
            value={settings.spinDuration}
            disabled={isSpinning}
            onChange={(e) => updateSetting('spinDuration', parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Slice spacing slider */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{t.spacingLabel}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{settings.sliceSpacing}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            value={settings.sliceSpacing}
            disabled={isSpinning}
            onChange={(e) => updateSetting('sliceSpacing', parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Border Width Slider */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{t.borderWidthLabel}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{settings.sliceBorderWidth}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            value={settings.sliceBorderWidth}
            disabled={isSpinning}
            onChange={(e) => updateSetting('sliceBorderWidth', parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Border color */}
        <div className="flex items-center justify-between py-1.5 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.borderColorLabel}</span>
          <input
            type="color"
            value={settings.sliceBorderColor}
            disabled={isSpinning}
            onChange={(e) => updateSetting('sliceBorderColor', e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer overflow-hidden shadow-xs hover:scale-105 border border-white/20"
          />
        </div>

        {/* Pointer color */}
        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.pointerColorLabel}</span>
          <input
            type="color"
            value={settings.pointerColor}
            disabled={isSpinning}
            onChange={(e) => updateSetting('pointerColor', e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer overflow-hidden shadow-xs hover:scale-105 border border-white/20"
          />
        </div>

        {/* Center button label */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.centerButtonTextLabel}
          </label>
          <input
            type="text"
            value={settings.centerButtonText}
            disabled={isSpinning}
            maxLength={15}
            onChange={(e) => updateSetting('centerButtonText', e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100"
          />
        </div>

        {/* Auto remove winner toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.removeWinnerOnDrawLabel}</span>
          <input
            type="checkbox"
            checked={settings.removeWinnerOnDraw}
            disabled={isSpinning}
            onChange={(e) => updateSetting('removeWinnerOnDraw', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
          />
        </div>

        {/* Weighted random selection toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.weightedModeLabel}</span>
          <input
            type="checkbox"
            checked={settings.weightedMode}
            disabled={isSpinning}
            onChange={(e) => updateSetting('weightedMode', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
          />
        </div>

        {/* Glow effects selection */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.glowLabel}</span>
          <input
            type="checkbox"
            checked={settings.glowEnabled}
            disabled={isSpinning}
            onChange={(e) => updateSetting('glowEnabled', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* SECTION 4: SOUND SETTINGS */}
      <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Volume2 className="w-4 h-4 text-indigo-500" />
          <span>Sound Settings</span>
        </div>

        {/* Enable Sound Toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enable Ticking Sounds</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            disabled={isSpinning}
            onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
          />
        </div>

        {/* Sound theme select */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.soundThemeLabel}
          </label>
          <select
            value={settings.soundTheme}
            disabled={!settings.soundEnabled || isSpinning}
            onChange={(e) => updateSetting('soundTheme', e.target.value as any)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100 disabled:opacity-50"
          >
            <option value="tick">Acoustic Tick</option>
            <option value="arcade">Arcade Blip</option>
            <option value="retro">Retro Click</option>
            <option value="synth">Sci-Fi Synth Sweep</option>
          </select>
        </div>

        {/* Sound volume slider */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{t.soundVolume}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            disabled={!settings.soundEnabled || isSpinning}
            onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Voice Winner announcement toggle */}
        <div className="flex items-center justify-between py-1.5 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.voiceAnnounceLabel}</span>
          <input
            type="checkbox"
            checked={settings.winnerAnnounce}
            disabled={isSpinning}
            onChange={(e) => updateSetting('winnerAnnounce', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* SECTION 5: ANIMATION SETTINGS */}
      <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Sparkle className="w-4 h-4 text-indigo-500" />
          <span>Animation Settings</span>
        </div>

        {/* Confetti toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.confettiLabel}</span>
          <input
            type="checkbox"
            checked={settings.confettiEnabled}
            disabled={isSpinning}
            onChange={(e) => updateSetting('confettiEnabled', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
          />
        </div>

        {/* Fireworks toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.fireworksLabel}</span>
          <input
            type="checkbox"
            checked={settings.fireworksEnabled}
            disabled={isSpinning}
            onChange={(e) => updateSetting('fireworksEnabled', e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* SECTION 6: BACKGROUNDS */}
      <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <LayoutGrid className="w-4 h-4 text-indigo-500" />
          <span>{t.backgroundPatternLabel}</span>
        </div>

        <div className="flex flex-col space-y-1.5">
          <select
            value={settings.backgroundPattern}
            disabled={isSpinning}
            onChange={(e) => updateSetting('backgroundPattern', e.target.value as any)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-slate-100"
          >
            <option value="none">Solid Color</option>
            <option value="dots">Polka Dots</option>
            <option value="grid">Grid Blueprint</option>
            <option value="particles">Animated Floating Particles</option>
          </select>
        </div>
      </div>

    </div>
  );
};
