import React, { useState, useEffect } from 'react';
import { Question, WrongAnswer } from '../types';
import { Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileVSProps {
  questions: Question[];
  onFinish: (scores: {p1: number, p2: number}, wrongAnswers: WrongAnswer[]) => void;
  onHome: () => void;
}

export function MobileVS({ questions, onFinish, onHome }: MobileVSProps) {
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

  const handleSelect = (optionId: string, player: number) => {
    if (isEvaluating) return;
    if (player === 1 && p1Answer) return;
    if (player === 2 && p2Answer) return;

    if (player === 1) setP1Answer(optionId);
    if (player === 2) setP2Answer(optionId);

    if (!p1Answer && !p2Answer && timer === null) {
      setTimer(10);
    }
  };

  const PlayerBoard = ({ player }: { player: number }) => {
    const pAns = player === 1 ? p1Answer : p2Answer;
    const isReady = pAns !== null;
    const pScore = player === 1 ? scores.p1 : scores.p2;
    const isP1 = player === 1;
    
    return (
      <div className={`flex-1 flex flex-col p-2 sm:p-4 bg-slate-50 relative pb-safe h-full overflow-y-auto`}>
        <div className={`mb-3 flex flex-col items-center p-3 rounded-2xl border-4 ${isP1 ? 'border-indigo-900 bg-indigo-100' : 'border-rose-900 bg-rose-100'} shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] shrink-0`}>
           <div className={`text-base font-black ${isP1 ? 'text-indigo-800' : 'text-rose-800'}`}>玩家 {player}</div>
           <div className="text-3xl font-black mt-1 text-slate-900">{pScore} 分</div>
        </div>

        <div className="flex flex-col justify-center mb-4 shrink-0">
           {/* Question Text hidden on extremely small devices if we need space, but keep it for normal */}
           <h3 className="text-base sm:text-lg font-bold leading-tight mb-2 whitespace-pre-line text-slate-800">
             {question.id}. {question.text}
           </h3>
           <div className={`text-sm font-bold text-center p-2 rounded-lg border-2 border-slate-900 ${
             isEvaluating 
               ? (pAns === question.answer ? 'bg-green-400 text-slate-900' : 'bg-red-400 text-white')
               : (isReady ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-dashed')
           }`}>
             {isEvaluating 
               ? (pAns === question.answer ? '正確(+1)' : (pAns ? '錯誤(-1)' : '未作答'))
               : (isReady ? '已鎖定答案' : '等待選答')}
           </div>
        </div>

        <div className="flex flex-col gap-2 pb-8 h-max">
          {(['A', 'B', 'C', 'D'] as const).map((optId) => {
            const text = question.options[optId];
            const isSelected = pAns === optId;
            const isCorrectAnswer = optId === question.answer;
            
            let btnClass = "border-2 border-slate-900 bg-white text-slate-800 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]";
            
            if (isReady && !isEvaluating) {
               if (isSelected) btnClass = "border-2 border-slate-900 bg-slate-900 text-white shadow-none translate-y-1";
               else btnClass += " opacity-50";
            } else if (isEvaluating) {
               if (isSelected && isCorrectAnswer) btnClass = "border-4 border-green-500 bg-green-400 font-black";
               else if (isSelected && !isCorrectAnswer) btnClass = "border-4 border-red-500 bg-red-400 text-white";
               else if (isCorrectAnswer) btnClass = "border-4 border-green-500 bg-white text-slate-800";
               else btnClass += " opacity-30";
            }

            return (
              <button
                key={optId}
                onClick={() => handleSelect(optId, player)}
                disabled={isReady || isEvaluating}
                className={`p-3 rounded-xl text-left transition-all flex flex-col min-h-[4rem] text-sm sm:text-base ${btnClass}`}
              >
                <span className="font-black opacity-80 shrink-0">({optId})</span>
                <span className="font-semibold line-clamp-3 mt-1 leading-snug">{text}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const progress = (currentIndex / questions.length) * 100;

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-slate-900 font-sans">
      
      <div className="flex h-16 bg-slate-900 text-white items-center justify-between px-4 border-b-4 border-slate-700 z-20">
        <button onClick={handleHomeClick} className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg transition-colors border-2 border-slate-800">
           <Home className="w-6 h-6 text-white" />
        </button>
        
        <div className="flex items-center gap-2">
           <div className={`px-4 py-1 rounded-full font-black text-sm sm:text-base border-2 ${timer !== null && timer <= 3 ? 'bg-red-500 border-red-700 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
              {timer !== null && !isEvaluating ? `⏳ 剩餘 ${timer} 秒` : (isEvaluating ? '判定中' : '搶答階段')}
           </div>
        </div>
        
        <div className="font-black bg-slate-800 px-3 py-1 border-2 border-slate-700 rounded-lg shrink-0">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="w-full h-2 bg-slate-800 border-b-2 border-slate-900 z-20 shrink-0">
        <motion.div 
          className="h-full bg-emerald-400 border-r-2 border-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 w-full relative overflow-hidden bg-slate-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-row divide-x-4 divide-slate-900 absolute inset-0"
          >
            <PlayerBoard player={1} />
            <PlayerBoard player={2} />
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
