import React, { useState, useEffect, useMemo } from 'react';
import { GameMode, Question, WrongAnswer } from './types';
import { rawOCRText } from './data/rawText';
import { parseQuestions } from './data/parser';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

import { StartScreen } from './components/StartScreen';
import { SinglePlayer } from './components/SinglePlayer';
import { MobileVS } from './components/MobileVS';
import { DesktopVS } from './components/DesktopVS';
import { OnlineVS } from './components/OnlineVS';
import { ResultScreen } from './components/ResultScreen';

export default function App() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<GameMode | 'start' | 'result'>('start');
  const [lastMode, setLastMode] = useState<GameMode>('single');
  const [selectedCount, setSelectedCount] = useState<number>(10);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [playerNames, setPlayerNames] = useState<{p1: string, p2: string} | undefined>(undefined);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Parse questions on mount
    try {
      const parsed = parseQuestions(rawOCRText);
      setAllQuestions(parsed);
    } catch (e) {
      console.error('Failed to parse questions:', e);
    } finally {
      setLoading(false);
    }

    if (localStorage.getItem('theme') === 'dark') {
      setIsDark(true);
      window.document.documentElement.classList.add('dark');
    }

    // PWA Auto-Update Logic
    if ('serviceWorker' in navigator) {
      // 1. Detect when the new service worker takes over and force a reload to get the new UI
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // 2. Proactively check for updates every time the user brings the app to the foreground
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.update();
          } catch (err) {
            console.error('Failed to check for SW update:', err);
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  const handleStart = (selectedMode: GameMode, count: number) => {
    // Randomize and select 'count' questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    setActiveQuestions(selected);
    setSelectedCount(selected.length);
    setScores({ p1: 0, p2: 0 });
    setWrongAnswers([]);
    setLastMode(selectedMode);
    setMode(selectedMode);
  };

  const handleFinishSingle = (finalScore: number, wrongs: WrongAnswer[]) => {
    setScores({ p1: finalScore, p2: 0 });
    setWrongAnswers(wrongs);
    setMode('result');
  };

  const handleFinishVS = (finalScores: { p1: number, p2: number }, wrongs: WrongAnswer[], names?: {p1: string, p2: string}) => {
    setScores(finalScores);
    setWrongAnswers(wrongs);
    setPlayerNames(names);
    setMode('result');
  };

  const handleRetestWrong = () => {
    if (wrongAnswers.length === 0) return;
    
    // Filter questions that CURRENT USER got wrong
    let relevantWrongs = wrongAnswers;
    // Only filter by UID if we were in an online match and have a user context
    if (lastMode === 'online-vs' && currentUser) {
      relevantWrongs = wrongAnswers.filter(w => w.uid === currentUser.uid);
    }
    
    if (relevantWrongs.length === 0) {
      alert(lastMode === 'online-vs' ? "目前沒有您的錯題記錄。" : "沒有錯題記錄。");
      return;
    }

    // Extract unique questions from relevantWrongs
    const wrongQMap = new Map<number, Question>();
    relevantWrongs.forEach(w => {
      wrongQMap.set(w.question.id, w.question);
    });
    const selected = Array.from(wrongQMap.values());
    
    // Always use single player mode for retesting wrongs
    setActiveQuestions(selected);
    setSelectedCount(selected.length);
    setScores({ p1: 0, p2: 0 });
    setWrongAnswers([]);
    setPlayerNames(undefined);
    setLastMode('single'); // fallback to single
    setMode('single');
  };

  const toggleDarkMode = () => {
    const root = window.document.documentElement;
    const willBeDark = !isDark;
    setIsDark(willBeDark);
    if (willBeDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-bold text-slate-500 animate-pulse">載入題庫中...</div>
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-bold text-red-500">無法解析題庫資料。</div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 min-h-screen selection:bg-blue-200 transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={toggleDarkMode} 
          className="p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-slate-900 dark:border-slate-700 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center w-12 h-12"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {mode === 'start' && (
        <StartScreen onStart={handleStart} />
      )}
      
      {mode === 'single' && (
        <SinglePlayer 
          questions={activeQuestions} 
          onFinish={handleFinishSingle}
          onHome={() => setMode('start')}
        />
      )}

      {mode === 'mobile-vs' && (
        <MobileVS 
          questions={activeQuestions} 
          onFinish={handleFinishVS} 
          onHome={() => setMode('start')}
        />
      )}

      {mode === 'desktop-vs' && (
        <DesktopVS 
          questions={activeQuestions} 
          onFinish={handleFinishVS} 
          onHome={() => setMode('start')}
        />
      )}

      {mode === 'online-vs' && (
        <OnlineVS 
          allQuestions={allQuestions}
          questionCount={selectedCount}
          onFinish={handleFinishVS} 
          onHome={() => setMode('start')}
        />
      )}

      {mode === 'result' && (
        <ResultScreen 
          mode={lastMode}
          scores={scores}
          playerNames={playerNames}
          total={activeQuestions.length}
          wrongAnswers={wrongAnswers}
          onRestart={() => handleStart(lastMode, selectedCount)}
          onHome={() => setMode('start')}
          onRetestWrong={handleRetestWrong}
        />
      )}
    </div>
  );
}
