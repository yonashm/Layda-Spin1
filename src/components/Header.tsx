import React, { useState } from 'react';
import { AppLanguage, TRANSLATIONS, SavedWheel, UserSession } from '../types';
import { Disc, Share2, Save, FileText, Moon, Sun, Languages, Plus, Trash2, Check, Copy, User, LogOut, Cloud, CloudOff, LogIn, RefreshCw } from 'lucide-react';

interface HeaderProps {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onNewWheel: () => void;
  onSaveWheel: (title: string) => void;
  savedWheels: SavedWheel[];
  onLoadWheelId: (id: string) => void;
  activeWheelTitle: string;
  user: UserSession | null;
  onSignOut: () => void;
  onOpenAuthModal: () => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  theme,
  toggleTheme,
  onNewWheel,
  onSaveWheel,
  savedWheels,
  onLoadWheelId,
  activeWheelTitle,
  user,
  onSignOut,
  onOpenAuthModal,
  syncStatus,
  onManualSync,
}) => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const t = TRANSLATIONS[language];

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    onSaveWheel(saveTitle);
    setIsSaveModalOpen(false);
    setSaveTitle('');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 h-16 flex items-center shrink-0">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          
          {/* LOGO & APP BRANDING */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Disc className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {t.appName}
              </h1>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 max-w-[130px] truncate">
                {activeWheelTitle || t.untitledWheel}
              </span>
            </div>
          </div>

          {/* HEADER NAVIGATION CONTROLS */}
          <div className="flex items-center gap-1.5 ml-auto lg:gap-3">
            
            {/* New Wheel Button */}
            <button
              onClick={onNewWheel}
              title={t.newWheel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.newWheel}</span>
            </button>

            {/* Save Wheel Trigger */}
            <button
              onClick={() => {
                setSaveTitle(activeWheelTitle || '');
                setIsSaveModalOpen(true);
              }}
              title={t.saveWheel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.saveWheel}</span>
            </button>

            {/* Share Wheel Trigger */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              title={t.share}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.share}</span>
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* Language Dropdown */}
            <div className="relative group">
              <button
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                title="Select Language"
              >
                <Languages className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hidden group-hover:block z-50 overflow-hidden py-1">
                <button
                  onClick={() => setLanguage('en')}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => setLanguage('am')}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  🇪🇹 አማርኛ (Amharic)
                </button>
                <button
                  onClick={() => setLanguage('om')}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  🇪🇹 Oromoo (Oromo)
                </button>
                <button
                  onClick={() => setLanguage('ti')}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  🇪🇹 ትግርኛ (Tigrinya)
                </button>
              </div>
            </div>

            {/* Dark/Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Cloud Sync Status Indicator */}
            {user && (
              <button
                onClick={onManualSync}
                disabled={syncStatus === 'syncing'}
                className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer relative ${
                  syncStatus === 'syncing'
                    ? 'text-indigo-500 bg-indigo-500/10'
                    : syncStatus === 'success'
                    ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : syncStatus === 'error'
                    ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
                title={
                  syncStatus === 'syncing'
                    ? 'Syncing to Cloud...'
                    : syncStatus === 'success'
                    ? 'All Changes Synced!'
                    : syncStatus === 'error'
                    ? 'Cloud Sync Failed (Retry)'
                    : 'Sync Data to Cloud'
                }
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : syncStatus === 'error' ? (
                  <CloudOff className="w-4 h-4" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                {syncStatus === 'success' && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>
            )}

            {/* Auth Dropdown or Login Trigger */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 pr-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Account Profile"
                >
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden md:inline max-w-[110px] truncate">{user.email.split('@')[0]}</span>
                </button>

                {isUserDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onManualSync();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2"
                      >
                        <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                        Sync Data Now
                      </button>
                      <button
                        onClick={() => {
                          onSignOut();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/60"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-950/80 active:scale-98"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* NAMING & SAVE MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
              <Save className="w-4 h-4 text-blue-500" />
              Save Your Spinner Wheel
            </h3>
            <form onSubmit={handleSaveSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                required
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Give your wheel a name..."
                className="px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-blue-500" />
              {t.shareTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-normal">
              {t.shareDesc}
            </p>

            <div className="flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
              
              {/* Fake QR Code styled beautifully */}
              <div className="w-32 h-32 bg-white rounded-lg p-2 border border-slate-200/60 shadow-xs flex items-center justify-center relative overflow-hidden">
                <div className="grid grid-cols-6 gap-1 w-full h-full opacity-80">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i + 3) % 4 === 0 || (i % 7 === 0) || i < 6 || i === 30 || i === 35
                          ? 'bg-slate-900 dark:bg-slate-950'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                {/* Logo center piece */}
                <div className="absolute inset-1/3 bg-white border border-slate-200/40 rounded-md flex items-center justify-center text-blue-600 font-extrabold text-xs">
                  WN
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {t.qrCode}
              </span>
            </div>

            {/* Copyable link bar */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all duration-300
                  ${
                    shareCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    {t.copyLink}
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-all"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
