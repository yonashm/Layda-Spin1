import React from 'react';
import { SpinResult, TRANSLATIONS, AppLanguage } from '../../types';
import { Trophy, Clock, Trash2, Download, Award, BarChart2 } from 'lucide-react';

interface ResultsTabProps {
  results: SpinResult[];
  onClearHistory: () => void;
  language: AppLanguage;
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ results, onClearHistory, language }) => {
  const t = TRANSLATIONS[language];

  // Format time of spin
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Export results to text file
  const handleExportResults = () => {
    if (results.length === 0) return;
    const reportText = [
      `WHEEL OF NAMES - WINNERS REPORT`,
      `Exported: ${new Date().toLocaleString()}`,
      `Total Spins: ${results.length}`,
      `=============================`,
      ...results.map((r, idx) => `${idx + 1}. Winner: "${r.winnerName}" | Time: ${new Date(r.timestamp).toLocaleString()}`)
    ].join('\n');

    const element = document.createElement("a");
    const file = new Blob([reportText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "spin_results_report.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No history yet
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Spin the wheel to decide names and log winner history!
        </p>
      </div>
    );
  }

  // Count metrics: Occurrence of each winner
  const winnerCounts = results.reduce((acc, r) => {
    acc[r.winnerName] = (acc[r.winnerName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topWinner = Object.entries(winnerCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  return (
    <div className="flex flex-col space-y-5 max-h-[85vh] overflow-y-auto pr-1 custom-scrollbar pb-10">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.totalSpins}</span>
          <span className="text-xl font-bold dark:text-white mt-1 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            {results.length}
          </span>
        </div>

        {topWinner && (
          <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Winner</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 truncate flex items-center gap-1">
              <Award className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              {topWinner[0]} ({topWinner[1]}x)
            </span>
          </div>
        )}
      </div>

      {/* History controls */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t.winnerHistory}
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleExportResults}
            title="Export results"
            className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-all cursor-pointer border border-transparent dark:border-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearHistory}
            title={t.clearHistory}
            className="p-1.5 bg-slate-50 hover:bg-red-50 dark:bg-slate-950/40 dark:hover:bg-red-950/10 rounded-lg text-slate-400 hover:text-red-500 transition-all cursor-pointer border border-transparent dark:border-slate-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Winner History List */}
      <div className="flex flex-col space-y-2">
        {results.map((res, idx) => (
          <div
            key={res.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/55 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-xs transition-all duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                {results.length - idx}
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                {res.winnerName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 bg-slate-50 dark:bg-slate-950/50 px-2 py-1 rounded-md border border-transparent dark:border-slate-800">
              <Clock className="w-3 h-3" />
              <span>{formatTime(res.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
