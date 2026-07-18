import React from 'react';
import { SavedWheel, TRANSLATIONS, AppLanguage } from '../../types';
import { Heart, FolderOpen, Copy, Trash2, Calendar, Users, Sparkles } from 'lucide-react';

interface GalleryTabProps {
  savedWheels: SavedWheel[];
  onLoadWheel: (wheel: SavedWheel) => void;
  onDeleteWheel: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicateWheel: (wheel: SavedWheel) => void;
  language: AppLanguage;
  activeWheelId: string | null;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({
  savedWheels,
  onLoadWheel,
  onDeleteWheel,
  onToggleFavorite,
  onDuplicateWheel,
  language,
  activeWheelId,
}) => {
  const t = TRANSLATIONS[language];

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (savedWheels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <Sparkles className="w-8 h-8 text-amber-500 mb-3 animate-bounce" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t.noSavedWheels}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Click the "Save Wheel" button in the navigation header to persist your custom settings!
        </p>
      </div>
    );
  }

  // Sort: Favorites first, then newest
  const sortedWheels = [...savedWheels].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="flex flex-col space-y-4 max-h-[85vh] overflow-y-auto pr-1 custom-scrollbar pb-10">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
        {t.loadPrompt} ({savedWheels.length})
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sortedWheels.map((wheel) => {
          const isActive = activeWheelId === wheel.id;

          return (
            <div
              key={wheel.id}
              className={`group flex flex-col p-4 rounded-xl border transition-all duration-300 shadow-xs hover:shadow-md
                ${
                  isActive
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              {/* Header inside card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                    {wheel.title}
                    {isActive && (
                      <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-500" />
                      {wheel.entries.length} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(wheel.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={() => onToggleFavorite(wheel.id)}
                  title={wheel.isFavorite ? t.unfavorite : t.favorite}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      wheel.isFavorite ? 'fill-red-500 text-red-500 scale-110' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Color spectrum representation */}
              <div className="flex h-1.5 w-full rounded-full overflow-hidden my-3 border border-slate-100 dark:border-slate-800">
                {wheel.colors.slice(0, 10).map((col, idx) => (
                  <div key={idx} className="flex-1" style={{ backgroundColor: col }} />
                ))}
              </div>

              {/* Action buttons inside card */}
              <div className="flex items-center justify-end gap-1 border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-1">
                <button
                  onClick={() => onDeleteWheel(wheel.id)}
                  title={t.delete}
                  className="p-1.5 bg-slate-50 hover:bg-red-50 dark:bg-slate-950/40 dark:hover:bg-red-950/10 text-slate-400 hover:text-red-500 rounded-lg transition-all cursor-pointer mr-auto border border-transparent dark:border-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDuplicateWheel(wheel)}
                  title={t.duplicate}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/30 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Clone
                </button>
                <button
                  onClick={() => onLoadWheel(wheel)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 rounded-lg text-xs font-bold shadow-md shadow-indigo-500/10 cursor-pointer transition-all"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  {t.open}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
