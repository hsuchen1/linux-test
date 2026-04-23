import React, { useState, useEffect } from 'react';
import { Question, WrongAnswer } from '../types';
import { Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SinglePlayerProps {
  questions: Question[];
  onFinish: (score: number, wrongAnswers: WrongAnswer[]) => void;
  onHome: () => void;
}

export function SinglePlayer({ questions, onFinish, onHome }: SinglePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const question = questions[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedId) return;
      const key = e.key.toLowerCase();
      // key map 1 -> A, 2 -> B etc.
      const keyMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      if (keyMap[key]) {
        handleSelect(keyMap[key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, currentIndex]);

  const handleSelect = (optionId: string) => {
    if (selectedId) return; // Prevent multiple clicks
    setSelectedId(optionId);
    
    const isCorrect = optionId === question.answer;
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setWrongAnswers(prev => [...prev, { question, chosenId: optionId, player: 1 }]);
    }

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(i => i + 1);
        setSelectedId(null);
      } else {
        onFinish(score + (isCorrect ? 1 : 0), [...wrongAnswers, ...(isCorrect ? [] : [{ question, chosenId: optionId, player: 1 }])]);
      }
    }, 1200);
  };

  const handleHomeClick = () => {
    if (window.confirm('確定要回到主畫面嗎？目前的練習進度將會遺失。')) {
      onHome();
    }
  };

  const progress = ((currentIndex) / questions.length) * 100;
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl mt-12 bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] border-4 border-slate-900 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center border-b-4 border-slate-900">
          <button onClick={handleHomeClick} className="bg-indigo-700 hover:bg-indigo-800 p-2 rounded-lg transition-colors border-2 border-indigo-900 shadow-[2px_2px_0px_0px_rgba(30,27,75,1)] active:translate-y-0.5 active:shadow-none">
             <Home className="w-5 h-5" />
          </button>
          <span className="font-semibold text-lg">單人練習</span>
          <span className="font-mono text-lg bg-indigo-800 border-2 border-indigo-900 px-3 py-1 rounded-lg shadow-inner">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-200 border-b-4 border-slate-900">
          <motion.div 
            className="h-full bg-emerald-400 border-r-2 border-slate-900"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="p-8 pb-10 flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed whitespace-pre-line">
                {question.id}. {question.text}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['A', 'B', 'C', 'D'] as const).map(optId => {
                  const text = question.options[optId];
                  const isSelected = selectedId === optId;
                  const isCorrectAnswer = optId === question.answer;
                  
                  let btnClass = "border-4 border-slate-900 bg-white text-slate-800 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]";
                  
                  if (selectedId) {
                    if (isSelected && isCorrectAnswer) {
                      btnClass = "border-4 border-emerald-500 bg-emerald-400 text-slate-900 font-black shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] translate-y-1";
                    } else if (isSelected && !isCorrectAnswer) {
                      btnClass = "border-4 border-red-500 bg-red-400 text-white font-black shadow-none translate-y-1";
                    } else if (!isSelected && isCorrectAnswer) {
                      // highlight the correct answer if they got it wrong
                      btnClass = "border-4 border-emerald-500 bg-white text-slate-900 font-black shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]";
                    } else {
                      btnClass = "border-4 border-slate-200 bg-slate-50 text-slate-400 opacity-50 shadow-none translate-y-1";
                    }
                  }

                  return (
                    <button
                      key={optId}
                      onClick={() => handleSelect(optId)}
                      disabled={!!selectedId}
                      className={`relative w-full p-4 rounded-xl text-left transition-all flex items-start text-lg ${btnClass}`}
                    >
                      <span className="font-bold mr-3 mt-0.5 opacity-70">({optId})</span>
                      <span>{text}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="bg-slate-100 border-t-4 border-slate-900 px-6 py-4 flex justify-between items-center text-slate-600 font-black tracking-wide text-lg">
          <div>目前得分 <span className="text-indigo-600 text-2xl">{score}</span></div>
          {selectedId && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-4 py-1 rounded-full border-2 ${selectedId === question.answer ? 'border-emerald-500 bg-emerald-100 text-emerald-700' : 'border-red-500 bg-red-100 text-red-700'}`}
            >
              {selectedId === question.answer ? '✅ 正確！' : '❌ 錯誤！'}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
