import { useState, useEffect } from 'react';
import { WheelEntry, WheelSettings, SavedWheel, SpinResult, AppLanguage, TRANSLATIONS, UserSession } from './types';
import { Header } from './components/Header';
import { WheelCanvas } from './components/WheelCanvas';
import { CelebrationCanvas } from './components/CelebrationCanvas';
import { EntriesTab } from './components/Tabs/EntriesTab';
import { CustomizeTab } from './components/Tabs/CustomizeTab';
import { GalleryTab } from './components/Tabs/GalleryTab';
import { ResultsTab } from './components/Tabs/ResultsTab';
import { WinnerModal } from './components/WinnerModal';
import { AuthModal } from './components/AuthModal';
import { audioSynth } from './utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, Play, Sparkles, Sliders, FolderClosed, Trophy, LayoutGrid, RotateCcw, HelpCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

// Safe LocalStorage wrapper to prevent iframe crashes when localStorage is blocked
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem failed:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e);
    }
  }
};

// Default mock items for a pristine first-load experience
const DEFAULT_ENTRIES: WheelEntry[] = [
  { id: '1', text: 'Tedi', weight: 1 },
  { id: '2', text: 'Yonas', weight: 1 },
  { id: '3', text: 'Yeshi', weight: 1 },
  { id: '4', text: 'Dabi', weight: 1 },
];

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const DEFAULT_SETTINGS: WheelSettings = {
  radius: 250,
  spinDuration: 8,
  soundEnabled: true,
  soundTheme: 'tick',
  volume: 0.5,
  winnerAnnounce: false,
  confettiEnabled: true,
  fireworksEnabled: true,
  removeWinnerOnDraw: false,
  weightedMode: false,
  pointerColor: '#ef4444',
  centerButtonText: 'SPIN',
  fontFamily: 'Space Grotesk',
  uppercase: true,
  sliceBorderColor: '#ffffff',
  sliceBorderWidth: 2,
  sliceSpacing: 1,
  glowEnabled: true,
  glowColor: '#3b82f6',
  backgroundPattern: 'grid',
};

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeWheelTitle, setActiveWheelTitle] = useState('My Main List');
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  const [entries, setEntries] = useState<WheelEntry[]>(DEFAULT_ENTRIES);
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [settings, setSettings] = useState<WheelSettings>(DEFAULT_SETTINGS);

  const [activeTab, setActiveTab] = useState<'entries' | 'customize' | 'gallery' | 'results'>('entries');
  const [isSpinning, setIsSpinning] = useState(false);

  // Celebration state
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'confetti' | 'fireworks' | 'both'>('both');

  // Winner modal state
  const [winnerEntry, setWinnerEntry] = useState<WheelEntry | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Local databases arrays
  const [savedWheels, setSavedWheels] = useState<SavedWheel[]>([]);
  const [results, setResults] = useState<SpinResult[]>([]);

  // User Authentication & Cloud Sync states
  const [user, setUser] = useState<UserSession | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Interactive bilingual usage guide state
  const [guideExpanded, setGuideExpanded] = useState<boolean>(() => {
    try {
      const saved = safeLocalStorage.getItem('wn_guide_expanded');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleGuide = () => {
    const nextState = !guideExpanded;
    setGuideExpanded(nextState);
    try {
      safeLocalStorage.setItem('wn_guide_expanded', String(nextState));
    } catch {}
  };

  const t = TRANSLATIONS[language];

  const handleSyncDataToCloud = async (
    session: UserSession | null,
    wheelsToSync: SavedWheel[],
    resultsToSync: SpinResult[]
  ) => {
    const currentSession = session || user;
    if (!currentSession) return;

    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/user/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.token}`
        },
        body: JSON.stringify({ wheels: wheelsToSync, results: resultsToSync }),
      });

      if (response.ok) {
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Failed to sync to cloud:', err);
      setSyncStatus('error');
    }
  };

  const handleLoadCloudData = async (session: UserSession) => {
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/user/data', {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (response.ok) {
        const cloudData = await response.json();

        if (cloudData.wheels && cloudData.wheels.length > 0) {
          setSavedWheels(cloudData.wheels);
          safeLocalStorage.setItem('wn_saved_wheels', JSON.stringify(cloudData.wheels));
        }
        if (cloudData.results && cloudData.results.length > 0) {
          setResults(cloudData.results);
          safeLocalStorage.setItem('wn_spin_results', JSON.stringify(cloudData.results));
        }

        if ((!cloudData.wheels || cloudData.wheels.length === 0) && savedWheels.length > 0) {
          await handleSyncDataToCloud(session, savedWheels, results);
        } else {
          setSyncStatus('success');
        }
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Failed to load cloud data:', err);
      setSyncStatus('error');
    }
  };

  const verifySessionAndLoadData = async (session: UserSession) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (response.ok) {
        await handleLoadCloudData(session);
      } else {
        handleSignOut();
      }
    } catch (err) {
      console.warn('Auth validation failed, working offline', err);
    }
  };

  const handleAuthSuccess = (session: UserSession) => {
    setUser(session);
    safeLocalStorage.setItem('wn_user_session', JSON.stringify(session));
    handleLoadCloudData(session);
  };

  const handleSignOut = () => {
    setUser(null);
    safeLocalStorage.removeItem('wn_user_session');
    setSyncStatus('idle');
  };

  const handleManualSync = () => {
    if (user) {
      handleSyncDataToCloud(user, savedWheels, results);
    }
  };

  // Load database files from LocalStorage on mount
  useEffect(() => {
    try {
      const storedWheels = safeLocalStorage.getItem('wn_saved_wheels');
      if (storedWheels) setSavedWheels(JSON.parse(storedWheels));

      const storedResults = safeLocalStorage.getItem('wn_spin_results');
      if (storedResults) setResults(JSON.parse(storedResults));

      const storedTheme = safeLocalStorage.getItem('wn_theme') as 'light' | 'dark' | null;
      if (storedTheme) {
        setTheme(storedTheme);
        document.documentElement.classList.toggle('dark', storedTheme === 'dark');
      } else {
        document.documentElement.classList.add('dark');
      }

      const storedLang = safeLocalStorage.getItem('wn_lang') as AppLanguage | null;
      if (storedLang) setLanguage(storedLang);

      // Check for active user session on load
      const storedUser = safeLocalStorage.getItem('wn_user_session');
      if (storedUser) {
        const session = JSON.parse(storedUser);
        setUser(session);
        verifySessionAndLoadData(session);
      }
    } catch (e) {
      console.warn('Local storage load failed:', e);
    }
  }, []);

  // Sync theme changes with DOM
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    safeLocalStorage.setItem('wn_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  // Sync language changes
  const handleSetLanguage = (lang: AppLanguage) => {
    setLanguage(lang);
    safeLocalStorage.setItem('wn_lang', lang);
  };

  // Add new blank list
  const handleNewWheel = () => {
    if (isSpinning) return;
    setActiveWheelId(null);
    setActiveWheelTitle('New Name Picker');
    setEntries([
      { id: '1', text: 'Tedi', weight: 1 },
      { id: '2', text: 'Yonas', weight: 1 },
      { id: '3', text: 'Yeshi', weight: 1 },
      { id: '4', text: 'Dabi', weight: 1 },
    ]);
    setColors(DEFAULT_COLORS);
    setSettings(DEFAULT_SETTINGS);
    setActiveTab('entries');
  };

  // Save wheel list to database (LocalStorage)
  const handleSaveWheel = (title: string) => {
    const cleanEntries = entries.filter((e) => e.text.trim().length > 0);
    const existingIdx = savedWheels.findIndex((w) => w.id === activeWheelId);

    const nowIso = new Date().toISOString();
    let updatedWheels: SavedWheel[] = [];

    if (activeWheelId && existingIdx !== -1) {
      // Edit existing
      const updated: SavedWheel = {
        ...savedWheels[existingIdx],
        title,
        entries: cleanEntries,
        colors,
        settings,
        updated_at: nowIso,
      };
      updatedWheels = [...savedWheels];
      updatedWheels[existingIdx] = updated;
    } else {
      // Create new
      const newId = `wheel-${Date.now()}`;
      const newWheel: SavedWheel = {
        id: newId,
        title,
        entries: cleanEntries,
        colors,
        settings,
        isFavorite: false,
        created_at: nowIso,
        updated_at: nowIso,
      };
      updatedWheels = [...savedWheels, newWheel];
      setActiveWheelId(newId);
    }

    setSavedWheels(updatedWheels);
    safeLocalStorage.setItem('wn_saved_wheels', JSON.stringify(updatedWheels));
    if (user) {
      handleSyncDataToCloud(user, updatedWheels, results);
    }
    setActiveWheelTitle(title);
    audioSynth.playTick('arcade', settings.volume);
  };

  // Load selected wheel list
  const handleLoadWheel = (wheel: SavedWheel) => {
    if (isSpinning) return;
    setActiveWheelId(wheel.id);
    setActiveWheelTitle(wheel.title);
    setEntries(wheel.entries);
    setColors(wheel.colors);
    setSettings(wheel.settings);
    setActiveTab('entries');
  };

  // Toggle favorite status on wheel
  const handleToggleFavorite = (id: string) => {
    const updated = savedWheels.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
    setSavedWheels(updated);
    safeLocalStorage.setItem('wn_saved_wheels', JSON.stringify(updated));
    if (user) {
      handleSyncDataToCloud(user, updated, results);
    }
  };

  // Duplicate a saved wheel
  const handleDuplicateWheel = (wheel: SavedWheel) => {
    const newId = `wheel-clone-${Date.now()}`;
    const cloned: SavedWheel = {
      ...wheel,
      id: newId,
      title: `${wheel.title} (Copy)`,
      isFavorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...savedWheels, cloned];
    setSavedWheels(updated);
    safeLocalStorage.setItem('wn_saved_wheels', JSON.stringify(updated));
    if (user) {
      handleSyncDataToCloud(user, updated, results);
    }
    audioSynth.playTick('arcade', settings.volume);
  };

  // Delete saved wheel
  const handleDeleteWheel = (id: string) => {
    const filtered = savedWheels.filter((w) => w.id !== id);
    setSavedWheels(filtered);
    safeLocalStorage.setItem('wn_saved_wheels', JSON.stringify(filtered));
    if (user) {
      handleSyncDataToCloud(user, filtered, results);
    }
    if (activeWheelId === id) {
      setActiveWheelId(null);
      setActiveWheelTitle('Untitled List');
    }
    audioSynth.playTick('retro', settings.volume);
  };

  // Clear spin winners logs
  const handleClearHistory = () => {
    setResults([]);
    safeLocalStorage.removeItem('wn_spin_results');
    if (user) {
      handleSyncDataToCloud(user, savedWheels, []);
    }
    audioSynth.playTick('retro', settings.volume);
  };

  // Spin evaluation complete callback
  const handleSpinComplete = (winner: WheelEntry) => {
    setWinnerEntry(winner);
    setIsWinnerModalOpen(true);

    // Track particle triggers
    if (settings.confettiEnabled || settings.fireworksEnabled) {
      setCelebrationType(
        settings.confettiEnabled && settings.fireworksEnabled
          ? 'both'
          : settings.confettiEnabled
          ? 'confetti'
          : 'fireworks'
      );
      setCelebrationActive(true);
    }

    // Append history result
    const newResult: SpinResult = {
      id: `result-${Date.now()}`,
      wheelId: activeWheelId || 'guest',
      winnerName: winner.text,
      timestamp: new Date().toISOString(),
    };

    const nextResults = [newResult, ...results];
    setResults(nextResults);
    safeLocalStorage.setItem('wn_spin_results', JSON.stringify(nextResults));
    if (user) {
      handleSyncDataToCloud(user, savedWheels, nextResults);
    }

    // Announce winner verbally if enabled
    if (settings.winnerAnnounce) {
      audioSynth.announceWinner(winner.text, language);
    }
  };

  // Close Winner Modal / Keep Winner options
  const handleKeepWinner = () => {
    setIsWinnerModalOpen(false);
    setCelebrationActive(false);
    setWinnerEntry(null);
  };

  // Close Winner Modal & Remove Winner from current selection list
  const handleRemoveWinner = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    setIsWinnerModalOpen(false);
    setCelebrationActive(false);
    setWinnerEntry(null);
  };

  // Setup Keyboard Shortcuts (Space to spin!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpinning && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const spinBtn = document.getElementById('spin-button') as HTMLButtonElement;
        if (spinBtn && !spinBtn.disabled) {
          spinBtn.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning]);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-all duration-300 relative overflow-hidden
        ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}
      style={{
        backgroundImage:
          settings.backgroundPattern === 'grid'
            ? theme === 'dark'
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 1px, transparent 1px), linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px)'
            : settings.backgroundPattern === 'dots'
            ? theme === 'dark'
              ? 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)'
              : 'radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)'
            : 'none',
        backgroundSize: '24px 24px, 48px 48px, 48px 48px',
      }}
    >
      {/* Abstract Background Decor Blobs */}
      <div className="absolute -left-40 -top-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Full screen Celebration Canvas particles overlay on win */}
      <CelebrationCanvas active={celebrationActive} type={celebrationType} />

      {/* Modern sticky Header */}
      <Header
        language={language}
        setLanguage={handleSetLanguage}
        theme={theme}
        toggleTheme={toggleTheme}
        onNewWheel={handleNewWheel}
        onSaveWheel={handleSaveWheel}
        savedWheels={savedWheels}
        onLoadWheelId={(id) => {
          const match = savedWheels.find((w) => w.id === id);
          if (match) handleLoadWheel(match);
        }}
        activeWheelTitle={activeWheelTitle}
        user={user}
        onSignOut={handleSignOut}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
      />

      {/* Account Authentication Dialog/Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Main Column Split Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-20 z-10">
        
        {/* LEFT COLUMN: INTERACTIVE CANVAS WHEEL STAGE (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 lg:p-10 rounded-3xl bg-white/40 dark:bg-slate-900/10 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-xl relative overflow-hidden">
          
          <div className="absolute top-4 left-6 flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Interactive Stage</span>
          </div>

          <WheelCanvas
            entries={entries.filter((e) => e.text.trim().length > 0)}
            colors={colors}
            settings={settings}
            onSpinComplete={handleSpinComplete}
            isSpinning={isSpinning}
            setIsSpinning={setIsSpinning}
          />

          {/* Quick instructions subtitle */}
          <p className="mt-4 text-[10px] text-slate-400/80 font-medium tracking-wide text-center">
            PRO-TIP: Press <kbd className="px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-800 font-bold">SPACE</kbd> key anywhere to spin!
          </p>
        </div>

        {/* RIGHT COLUMN: TABBED CONTROL SIDEBAR (5 cols) */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col relative">
          
          {/* Decorative Corner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

          {/* Navigation Tab headers with Framer Motion slide selector */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1 mb-6 border border-slate-200/50 dark:border-slate-800">
            {[
              { id: 'entries', label: t.entries, icon: Edit3 },
              { id: 'customize', label: t.customize, icon: Sliders },
              { id: 'gallery', label: t.gallery, icon: FolderClosed },
              { id: 'results', label: t.results, icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none
                    ${
                      isSelected
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeTabSelector"
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/40 dark:border-slate-700/50"
                      transition={{ type: 'spring', duration: 0.4 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 z-10 shrink-0" />
                  <span className="z-10 truncate hidden sm:inline text-[11px]">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content area container */}
          <div className="min-h-[400px]">
            {activeTab === 'entries' && (
              <EntriesTab
                entries={entries}
                setEntries={setEntries}
                settings={settings}
                language={language}
                isSpinning={isSpinning}
              />
            )}
            {activeTab === 'customize' && (
              <CustomizeTab
                settings={settings}
                setSettings={setSettings}
                colors={colors}
                setColors={setColors}
                language={language}
                isSpinning={isSpinning}
              />
            )}
            {activeTab === 'gallery' && (
              <GalleryTab
                savedWheels={savedWheels}
                onLoadWheel={handleLoadWheel}
                onDeleteWheel={handleDeleteWheel}
                onToggleFavorite={handleToggleFavorite}
                onDuplicateWheel={handleDuplicateWheel}
                language={language}
                activeWheelId={activeWheelId}
              />
            )}
            {activeTab === 'results' && (
              <ResultsTab
                results={results}
                onClearHistory={handleClearHistory}
                language={language}
              />
            )}
          </div>

        </div>

        {/* BILINGUAL USER GUIDE (12 cols) */}
        <div className="lg:col-span-12 bg-white/65 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-6 shadow-xl overflow-hidden relative transition-all">
          <div 
            onClick={handleToggleGuide}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>የአጠቃቀም መመሪያ</span>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wide">How to Use Layda Spin</span>
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  ይህን መተግበሪያ በቀላሉ እንዴት መጠቀም እንደሚችሉ ፈጣን ማብራሪያ • Quick guide on getting started
                </p>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all">
              {guideExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {guideExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-slate-100 dark:border-slate-800/60 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Amharic Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/40 pb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">በአማርኛ (Amharic)</span>
                      <span className="px-2 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full font-bold">አማርኛ</span>
                    </div>
                    <ul className="space-y-3.5">
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">1</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">ዕድሎችን ማስገባት (Entries)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">በስተቀኝ ባለው "ማስገቢያዎች" Tab ላይ ስሞችን፣ ምርጫዎችን ወይም አማራጮችን አንድ በአንድ ያስገቡ። እያንዳንዱ አማራጭ የራሱ የሆነ ክብደት (Weight) ሊኖረው ይችላል።</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">2</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">ማሽከርከር (Spin the Wheel)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">በስተግራ ያለውን እሽክርክሪት መሃል ላይ በመጫን ወይም የቁልፍ ሰሌዳዎን <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold">SPACE</kbd> ቁልፍ በመጫን ማሽከርከር ይጀምሩ።</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">3</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">በራስዎ ምርጫ ማበጀት (Customize)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">የእሽክርክሪቱን ቀለማት፣ ድምፆች፣ ፍጥነት፣ የሚቆይበትን ጊዜ እና አጠቃላይ የገጽታ ዘይቤ በ"ማበጀት" Tab ውስጥ ባሉ ምርጫዎች የራስዎ ማድረግ ይችላሉ።</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">4</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">ማስቀመጥ እና ደመና ማመሳሰል (Save & Sync)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">በላይኛው ቀኝ በኩል "Sign In" የሚለውን በመጫን በኢሜይልዎ መለያ ይክፈቱ፤ ይህ ያዘጋጇቸውን እሽክርክሪቶች ደመና (Cloud) ላይ እንዲያስቀምጡና በማንኛውም ስልክ ወይም ላፕቶፕ እንዲያገኟቸው ይረዳል።</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* English Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/40 pb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">በእንግሊዝኛ (English)</span>
                      <span className="px-2 py-0.5 text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">English</span>
                    </div>
                    <ul className="space-y-3.5">
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">1</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Add Wheel Entries</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">Under the "Entries" tab in the right column, input names, raffle items, or choices. You can assign custom weights to options to bias outcomes.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">2</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Spin the Wheel</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">Simply click the center of the interactive wheel on the left, click the spin button, or hit <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold">SPACE</kbd> anywhere on your keyboard!</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">3</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Customize Everything</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">Head over to the "Customize" tab to modify colors, choose sound tick presets, set custom spin durations, and fine-tune celebration physics.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">4</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Save & Cloud Synchronize</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">Click "Sign In" in the top right to register/login with your email. Your custom wheels and log records will automatically back up to our cloud!</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Bottom Micro-Bar Footer */}
      <footer className="py-2.5 bg-white/50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/50 px-6 flex flex-col sm:flex-row gap-2 items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-600 shrink-0 select-none z-10">
        <div className="flex gap-4">
          <span>Layda Spin v2.4.0-Stable</span>
          <span className="hidden sm:inline">60 FPS Active</span>
        </div>
        <div className="text-center font-medium text-slate-400 dark:text-slate-500 normal-case tracking-normal">
          Developed by <span className="font-semibold text-indigo-500/90 dark:text-indigo-400">Layda Tech (Yonas)</span> and <span className="font-semibold text-purple-500/90 dark:text-purple-400">Google AI</span>
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">Local Storage: 1.2MB</span>
          <span className="text-emerald-600 dark:text-emerald-500">Cloud Synced</span>
        </div>
      </footer>

      {/* Winner Pop-up modal */}
      <WinnerModal
        isOpen={isWinnerModalOpen}
        winner={winnerEntry}
        onClose={handleKeepWinner}
        onKeepWinner={handleKeepWinner}
        onRemoveWinner={handleRemoveWinner}
        language={language}
        volume={settings.volume}
      />
    </div>
  );
}
