import React, { useState } from 'react';
import { WheelEntry, WheelSettings, TRANSLATIONS, AppLanguage } from '../../types';
import { Sparkles, Shuffle, ArrowUpDown, RefreshCw, Upload, Download, Plus, Trash2, HelpCircle } from 'lucide-react';

interface EntriesTabProps {
  entries: WheelEntry[];
  settings: WheelSettings;
  language: AppLanguage;
  setEntries: (entries: WheelEntry[]) => void;
  isSpinning: boolean;
}

export const EntriesTab: React.FC<EntriesTabProps> = ({
  entries,
  settings,
  language,
  setEntries,
  isSpinning,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const t = TRANSLATIONS[language];

  // Helper to convert entry array to newline string
  const entriesText = entries.map((e) => e.text).join('\n');

  // Handle textarea text change
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSpinning) return;
    const lines = e.target.value.split('\n');
    const newEntries = lines.map((line, idx) => {
      const existing = entries[idx];
      return {
        id: existing?.id || `entry-${Date.now()}-${idx}-${Math.random()}`,
        text: line,
        weight: existing?.weight || 1,
        color: existing?.color,
      };
    });
    setEntries(newEntries);
  };

  // Quick action: Shuffle list
  const handleShuffle = () => {
    if (isSpinning || entries.length === 0) return;
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    setEntries(shuffled);
  };

  // Quick action: Sort alphabetical
  const handleSortAZ = () => {
    if (isSpinning || entries.length === 0) return;
    const sorted = [...entries].sort((a, b) => a.text.localeCompare(b.text));
    setEntries(sorted);
  };

  // Quick action: Reverse list
  const handleReverse = () => {
    if (isSpinning || entries.length === 0) return;
    const reversed = [...entries].reverse();
    setEntries(reversed);
  };

  // Quick action: Randomize (load fun default templates)
  const handleRandomize = () => {
    if (isSpinning) return;
    const funLists = [
      ['Pizza', 'Burger', 'Sushi', 'Tacos', 'Pasta', 'Salad', 'Ramen', 'Steak'],
      ['Truth', 'Dare', 'Double Dare', 'Spin Again', 'Pass', 'Perform a dance', 'Tell a joke'],
      ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Cyan'],
      ['Alex', 'John', 'Yonas', 'Abraham', 'Eyob', 'Tedi', 'Abebe', 'Sara', 'Helen', 'Ruth']
    ];
    const chosenList = funLists[Math.floor(Math.random() * funLists.length)];
    const newEntries = chosenList.map((text, idx) => ({
      id: `entry-rand-${idx}-${Date.now()}`,
      text,
      weight: 1,
    }));
    setEntries(newEntries);
  };

  // CSV Import
  const handleImportCsv = () => {
    if (isSpinning) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;
        const items = text
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        const newEntries = items.map((text, idx) => ({
          id: `entry-csv-${idx}-${Date.now()}`,
          text,
          weight: 1,
        }));
        setEntries(newEntries);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // CSV Export
  const handleExportCsv = () => {
    if (entries.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," + entries.map(e => e.text).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wheel_entries.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI suggestion pull from local server endpoint
  const handleAiSuggestions = async () => {
    if (!aiPrompt.trim() || isSpinning) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (res.ok && data.suggestions && Array.isArray(data.suggestions)) {
        const newEntries = data.suggestions.map((text: string, idx: number) => ({
          id: `entry-ai-${idx}-${Date.now()}`,
          text,
          weight: 1,
        }));
        setEntries(newEntries);
        setAiPrompt('');
      } else {
        setAiError(data.error || 'Failed to fetch suggestions');
      }
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with AI service');
    } finally {
      setAiLoading(false);
    }
  };

  // Update a single entry's weight
  const updateWeight = (id: string, weight: number) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, weight: Math.max(1, weight) } : e));
    setEntries(updated);
  };

  // Delete single entry
  const deleteEntry = (id: string) => {
    const filtered = entries.filter((e) => e.id !== id);
    setEntries(filtered);
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Entry Counter */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.entries}</span>
        <span className="text-xs font-bold bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg border border-indigo-500/20">
          {entries.length}
        </span>
      </div>

      {/* Primary Entries Textarea */}
      <div className="relative flex flex-col space-y-2">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {t.entries} (One per line)
        </label>
        <textarea
          value={entriesText}
          onChange={handleTextareaChange}
          disabled={isSpinning}
          placeholder="Enter names/options here..."
          className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50 resize-y"
        />
      </div>

      {/* Quick Action Toolbar */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleShuffle}
          disabled={isSpinning}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
          {t.shuffle}
        </button>
        <button
          onClick={handleSortAZ}
          disabled={isSpinning}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
          {t.sortAZ}
        </button>
        <button
          onClick={handleReverse}
          disabled={isSpinning}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
          {t.reverse}
        </button>
        <button
          onClick={handleRandomize}
          disabled={isSpinning}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {t.randomize}
        </button>
      </div>

      {/* CSV Import/Export */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
        <button
          onClick={handleImportCsv}
          disabled={isSpinning}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 cursor-pointer transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          {t.importCsv}
        </button>
        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 cursor-pointer transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          {t.exportCsv}
        </button>
      </div>

      {/* Weighted configuration (only shown if weightedMode is true) */}
      {settings.weightedMode && entries.length > 0 && (
        <div className="flex flex-col space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            {t.weightLabel} Configuration
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {entries.filter(e => e.text.trim().length > 0).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-medium truncate max-w-[120px] dark:text-slate-200">{entry.text}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{t.weightLabel}:</span>
                  <input
                    type="number"
                    min="1"
                    value={entry.weight}
                    disabled={isSpinning}
                    onChange={(e) => updateWeight(entry.id, parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs border border-slate-200 dark:border-slate-800 bg-transparent rounded-sm py-0.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    disabled={isSpinning}
                    className="text-red-500 hover:text-red-400 p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI SUGGESTIONS SECTION */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
          <span>{t.suggestEntries}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t.suggestEntriesDesc}
        </p>

        <div className="relative flex flex-col space-y-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={aiLoading || isSpinning}
            placeholder={t.suggestPromptPlaceholder}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
          <button
            onClick={handleAiSuggestions}
            disabled={aiLoading || !aiPrompt.trim() || isSpinning}
            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300
              ${
                aiLoading
                  ? 'bg-purple-600/20 text-purple-400 cursor-wait'
                  : aiPrompt.trim()
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent dark:border-slate-800'
              }`}
          >
            {aiLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {t.aiGenerate}
              </>
            )}
          </button>
          {aiError && (
            <p className="text-[11px] text-red-500 font-medium leading-tight">
              {aiError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
