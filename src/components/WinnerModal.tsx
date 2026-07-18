import React, { useEffect } from 'react';
import { WheelEntry, TRANSLATIONS, AppLanguage } from '../types';
import { audioSynth } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCw, Trash2, X, Check, Copy } from 'lucide-react';

interface WinnerModalProps {
  isOpen: boolean;
  winner: WheelEntry | null;
  onClose: () => void;
  onRemoveWinner: (id: string) => void;
  onKeepWinner: () => void;
  language: AppLanguage;
  volume: number;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  winner,
  onClose,
  onRemoveWinner,
  onKeepWinner,
  language,
  volume,
}) => {
  const t = TRANSLATIONS[language];

  // Play celebratory sound effects on mount/open
  useEffect(() => {
    if (isOpen && winner) {
      audioSynth.playWinChime(volume);
    }
  }, [isOpen, winner, volume]);

  const handleCopyWinner = () => {
    if (!winner) return;
    navigator.clipboard.writeText(winner.text);
    // Standard alert-free notification or confirmation
    audioSynth.playTick('arcade', volume);
  };

  if (!isOpen || !winner) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop glassmorphism filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onKeepWinner}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl overflow-hidden z-10"
        >
          {/* Inner radial gradient light shine */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-b from-indigo-500/15 to-transparent rounded-full filter blur-3xl pointer-events-none" />

          {/* Close button top right */}
          <button
            onClick={onKeepWinner}
            className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Celebration Trophy Icon */}
          <div className="flex flex-col items-center text-center mt-4">
            <motion.div
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20"
            >
              <Trophy className="w-8 h-8" />
            </motion.div>

            <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">
              {t.congratulations}
            </span>

            {/* Giant display text of winner */}
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 mb-6 tracking-tight leading-none px-4 select-all break-all">
              {winner.text}
            </h2>

            {/* Buttons list */}
            <div className="flex flex-col w-full gap-2.5">
              
              {/* Keep winner / Close */}
              <button
                onClick={onKeepWinner}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {t.keepWinner}
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Remove winner */}
                <button
                  onClick={() => onRemoveWinner(winner.id)}
                  className="py-3 px-3 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-200/40 dark:border-red-900/10"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.removeWinner}
                </button>

                {/* Copy winner */}
                <button
                  onClick={handleCopyWinner}
                  className="py-3 px-3 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
                >
                  <Copy className="w-4 h-4" />
                  {t.copyWinner}
                </button>
              </div>

              {/* Close & Spin again shortcut */}
              <button
                onClick={onKeepWinner}
                className="w-full mt-2 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                {t.spinAgain}
              </button>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
