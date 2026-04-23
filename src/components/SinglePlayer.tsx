import React, { useState, useEffect } from 'react';
import { Question, WrongAnswer } from '../types';
import { Home } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl mt-12 bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] border-4 border-slate-900 overflow-hidden flex flex-col">
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center border-b-4 border-slate-900">
          <button onClick={onHome} className="bg-indigo-700 hover:bg-indigo-800 p-2 rounded-lg transition-colors border-2 border-indigo-900">
             <Home className="w-5 h-5" />
          </button>
          <span className="font-semibold text-lg">單人練習</span>
          <span className="font-mono text-lg bg-indigo-800 border-2 border-indigo-900 px-3 py-1 rounded-lg">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        
        <div className="p-8 pb-10 flex-1">
          <div className="text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed whitespace-pre-line">
            {question.id}. {question.text}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map(optId => {
              const text = question.options[optId];
              const isSelected = selectedId === optId;
              const isCorrectAnswer = optId === question.answer;
              
              let btnClass = "border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
              
              if (selectedId) {
                if (isSelected && isCorrectAnswer) {
                  btnClass = "border-green-500 bg-green-50 text-green-700";
                } else if (isSelected && !isCorrectAnswer) {
                  btnClass = "border-red-500 bg-red-50 text-red-700";
                } else if (!isSelected && isCorrectAnswer) {
                  // highlight the correct answer if they got it wrong
                  btnClass = "border-green-500 bg-green-50 text-green-700";
                } else {
                  btnClass = "border-slate-200 bg-slate-100 text-slate-400 opacity-50";
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
        </div>
        
        <div className="bg-slate-100 px-6 py-4 flex justify-between items-center text-slate-600 font-medium">
          <div>目前得分: {score}</div>
          {selectedId && (
            <div className={`font-bold ${selectedId === question.answer ? 'text-green-600' : 'text-red-500'}`}>
              {selectedId === question.answer ? '正確！' : '錯誤！'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
