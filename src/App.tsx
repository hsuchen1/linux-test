import React, { useState, useEffect, useMemo } from 'react';
import { GameMode, Question, WrongAnswer } from './types';
import { rawOCRText } from './data/rawText';
import { parseQuestions } from './data/parser';

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
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);

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

  const handleFinishVS = (finalScores: { p1: number, p2: number }, wrongs: WrongAnswer[]) => {
    setScores(finalScores);
    setWrongAnswers(wrongs);
    setMode('result');
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
    <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen selection:bg-blue-200">
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
          total={activeQuestions.length}
          wrongAnswers={wrongAnswers}
          onRestart={() => handleStart(lastMode, selectedCount)}
          onHome={() => setMode('start')}
        />
      )}
    </div>
  );
}
