import React, { useState, useEffect } from 'react';
import { Question, WrongAnswer } from '../types';
import { Home, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DesktopVSProps {
  questions: Question[];
  onFinish: (scores: {p1: number, p2: number}, wrongAnswers: WrongAnswer[]) => void;
  onHome: () => void;
}

export function DesktopVS({ questions, onFinish, onHome }: DesktopVSProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  
  const [p1Answer, setP1Answer] = useState<string | null>(null);
  const [p2Answer, setP2Answer] = useState<string | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const question = questions[currentIndex];

  const handleHomeClick = () => {
    if (window.confirm("確定要離開嗎？此舉將直接結束這場對戰。")) {
      onHome();
    }
  };

  const evaluateAndNext = (finalP1Ans: string | null, finalP2Ans: string | null) => {
    setIsEvaluating(true);
    setTimer(null);
    
    let finalP1 = scores.p1;
    let finalP2 = scores.p2;
    let wrongs = [...wrongAnswers];

    if (finalP1Ans) {
      if (finalP1Ans === question.answer) finalP1 += 1;
      else {
        finalP1 -= 1;
        wrongs.push({ question, chosenId: finalP1Ans, player: 1 });
      }
    }
    
    if (finalP2Ans) {
      if (finalP2Ans === question.answer) finalP2 += 1;
      else {
        finalP2 -= 1;
        wrongs.push({ question, chosenId: finalP2Ans, player: 2 });
      }
    }

    setScores({ p1: finalP1, p2: finalP2 });
    setWrongAnswers(wrongs);

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(i => i + 1);
        setP1Answer(null);
        setP2Answer(null);
        setIsEvaluating(false);
      } else {
        onFinish({ p1: finalP1, p2: finalP2 }, wrongs);
      }
    }, 2000);
  };

  useEffect(() => {
    if (p1Answer && p2Answer && !isEvaluating) {
      evaluateAndNext(p1Answer, p2Answer);
    }
  }, [p1Answer, p2Answer, isEvaluating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer !== null && timer > 0 && !isEvaluating) {
      interval = setInterval(() => setTimer(t => (t ? t - 1 : 0)), 1000);
    } else if (timer === 0 && !isEvaluating) {
      evaluateAndNext(p1Answer, p2Answer);
    }
    return () => clearInterval(interval);
  }, [timer, isEvaluating, p1Answer, p2Answer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEvaluating) return;
      
      const key = e.key.toLowerCase();
      
      const p1Map: Record<string, string> = { 'q': 'A', 'w': 'B', 'e': 'C', 'r': 'D' };
      const p2Map: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };

      let changed = false;
      if (p1Map[key] && !p1Answer) {
        setP1Answer(p1Map[key]);
        changed = true;
      } else if (p2Map[key] && !p2Answer) {
        setP2Answer(p2Map[key]);
        changed = true;
      }

      if (changed && !p1Answer && !p2Answer && timer === null) {
        setTimer(10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [p1Answer, p2Answer, isEvaluating, timer]);

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex justify-between items-end mb-4 px-4 relative">
        <button onClick={handleHomeClick} className="absolute -top-12 left-4 bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg transition-colors border-2 border-slate-700 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-y-1 active:translate-x-1">
           <Home className="w-6 h-6" />
        </button>

        <div className="bg-indigo-400 text-slate-900 px-6 py-4 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] w-56 relative overflow-hidden">
          {p1Answer && !isEvaluating && <div className="absolute top-0 right-0 bg-indigo-900 text-white text-xs font-black px-2 py-1 rounded-bl-lg">已鎖定</div>}
          <div className="text-sm font-black opacity-80 mb-1 flex items-center gap-2">
            <Keyboard className="w-4 h-4" /> 玩家 1 (左)
          </div>
          <div className="text-4xl font-black">{scores.p1} 分</div>
          <div className="mt-2 flex gap-1">
            {['Q','W','E','R'].map(k => <kbd key={k} className="px-2 py-1 bg-white border-2 border-slate-900 rounded text-xs font-black">{k}</kbd>)}
          </div>
        </div>
        
        <div className="text-center pb-4 flex flex-col items-center gap-2">
           <div className={`px-4 py-1 rounded-full font-black text-slate-900 border-2 ${timer !== null && timer <= 3 ? 'bg-rose-400 border-rose-900 animate-pulse text-white' : 'bg-white border-slate-900'}`}>
              {timer !== null && !isEvaluating ? `⏳ 剩餘 ${timer} 秒` : (isEvaluating ? '判定中' : '搶答階段')}
           </div>
           <div className="text-2xl font-black text-slate-900">VS</div>
           <div className="font-bold text-slate-600">第 {currentIndex + 1} / {questions.length} 題</div>
        </div>

        <div className="bg-rose-400 text-slate-900 px-6 py-4 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] w-56 text-right flex flex-col items-end relative overflow-hidden">
          {p2Answer && !isEvaluating && <div className="absolute top-0 left-0 bg-rose-900 text-white text-xs font-black px-2 py-1 rounded-br-lg">已鎖定</div>}
          <div className="text-sm font-black opacity-80 mb-1 flex items-center justify-end gap-2 w-full">
            玩家 2 (右) <Keyboard className="w-4 h-4" />
          </div>
          <div className="text-4xl font-black">{scores.p2} 分</div>
          <div className="mt-2 flex gap-1">
            {['1','2','3','4'].map(k => <kbd key={k} className="px-2 py-1 bg-white border-2 border-slate-900 rounded text-xs font-black">{k}</kbd>)}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl h-3 bg-slate-200 border-4 border-slate-900 rounded-full overflow-hidden mb-2">
        <motion.div 
          className="h-full bg-emerald-400 border-r-2 border-slate-900"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] overflow-hidden flex flex-col min-h-[500px] mt-2 max-h-[60vh] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="p-8 md:p-12 flex-1 flex flex-col overflow-y-auto"
          >
            <div className="text-2xl md:text-3xl font-black text-slate-900 mb-10 leading-relaxed whitespace-pre-line text-center shrink-0">
              {question.id}. {question.text}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto shrink-0 pb-4">
              {(['A', 'B', 'C', 'D'] as const).map((optId, idx) => {
                const text = question.options[optId];
                const isP1 = p1Answer === optId;
                const isP2 = p2Answer === optId;
                const isCorrectAnswer = optId === question.answer;
                
                let btnClass = "border-4 border-slate-900 bg-white text-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]";
                
                if (isEvaluating) {
                  if (isCorrectAnswer) btnClass = "border-4 border-emerald-500 bg-emerald-400 text-slate-900 font-black scale-[1.02] shadow-[8px_8px_0px_0px_rgba(16,185,129,1)]";
                  else if (isP1 || isP2) btnClass = "border-4 border-slate-900 bg-slate-200 text-slate-400 opacity-60";
                  else btnClass = "border-4 border-slate-200 bg-slate-50 text-slate-300 opacity-40";
                  
                  if (isP1 && isP2 && !isCorrectAnswer) btnClass = "border-4 border-purple-900 bg-purple-200 text-slate-400 opacity-60";
                  else if (isP1 && !isCorrectAnswer) btnClass = "border-4 border-indigo-900 bg-indigo-100 text-slate-400 opacity-60";
                  else if (isP2 && !isCorrectAnswer) btnClass = "border-4 border-rose-900 bg-rose-100 text-slate-400 opacity-60";
                } else {
                   btnClass += " hover:bg-slate-50";
                }

                return (
                  <div
                    key={optId}
                    className={`p-6 rounded-[2rem] transition-all duration-300 flex flex-col items-center justify-center text-center relative ${btnClass}`}
                  >
                    {isP1 && isEvaluating && <div className="absolute top-0 left-4 max-w-fit px-3 py-1 bg-indigo-600 text-white font-black text-sm rounded-b-lg border-x-2 border-b-2 border-slate-900 shadow-md transform -translate-y-1">P1 選擇</div>}
                    {isP2 && isEvaluating && <div className="absolute top-0 right-4 max-w-fit px-3 py-1 bg-rose-500 text-white font-black text-sm rounded-b-lg border-x-2 border-b-2 border-slate-900 shadow-md transform -translate-y-1">P2 選擇</div>}

                    <div className="text-xl font-bold mt-4 mb-2"><span className="opacity-60 mr-1">({optId})</span> {text}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {isEvaluating && (
          <div className="flex w-full text-center text-lg font-black border-t-4 border-slate-900 shrink-0 relative z-10">
            <div className={`flex-1 p-4 border-r-4 border-slate-900 ${p1Answer === question.answer ? 'bg-emerald-400 text-slate-900' : (p1Answer ? 'bg-rose-400 text-white' : 'bg-slate-200 text-slate-500')}`}>
               玩家 1 {p1Answer === question.answer ? '正確(+1)' : (p1Answer ? '錯誤(-1)' : '未作答')}
            </div>
            <div className={`flex-1 p-4 ${p2Answer === question.answer ? 'bg-emerald-400 text-slate-900' : (p2Answer ? 'bg-rose-400 text-white' : 'bg-slate-200 text-slate-500')}`}>
               玩家 2 {p2Answer === question.answer ? '正確(+1)' : (p2Answer ? '錯誤(-1)' : '未作答')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
