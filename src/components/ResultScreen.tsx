import React, { useMemo } from 'react';
import { GameMode, Question, WrongAnswer } from '../types';
import { Award, RotateCcw, Home, Frown } from 'lucide-react';

interface ResultScreenProps {
  mode: GameMode;
  scores: { p1: number, p2: number };
  playerNames?: { p1: string, p2: string };
  total: number;
  wrongAnswers: WrongAnswer[];
  onRestart: () => void;
  onHome: () => void;
  onRetestWrong?: () => void;
}

export function ResultScreen({ mode, scores, playerNames, total, wrongAnswers, onRestart, onHome, onRetestWrong }: ResultScreenProps) {
  
  const isSingle = mode === 'single';

  const groupedWrongs = useMemo(() => {
    const map = new Map<number, { question: Question; attempts: { chosenId: string; playerName?: string; player: number }[] }>();
    wrongAnswers.forEach(wa => {
      if (!map.has(wa.question.id)) {
        map.set(wa.question.id, { question: wa.question, attempts: [] });
      }
      map.get(wa.question.id)!.attempts.push({ 
        chosenId: wa.chosenId, 
        playerName: wa.playerName, 
        player: wa.player 
      });
    });
    return Array.from(map.values());
  }, [wrongAnswers]);
  
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] dark:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-slate-900 overflow-hidden p-8 md:p-12">
        
        <div className="text-center mb-10">
          <Award className="w-24 h-24 mx-auto text-amber-500 mb-6 drop-shadow-md" />
          <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">練習結束</h1>
          
          {isSingle ? (
            <div className="text-3xl mt-6 font-bold bg-amber-100 dark:bg-amber-900/50 border-4 border-slate-900 p-4 rounded-2xl w-fit mx-auto shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:text-amber-100">
              總得分: <span className="font-black text-indigo-600 dark:text-indigo-400">{scores.p1}</span> / {total}
            </div>
          ) : (
            <div className="mt-8 flex justify-center items-center gap-12 bg-slate-50 dark:bg-slate-800 p-6 border-4 border-slate-900 rounded-[2rem] shadow-[inset_4px_4px_0px_0px_rgba(15,23,42,0.05)] dark:shadow-none w-fit mx-auto">
              <div className={`text-center ${scores.p1 > scores.p2 ? 'scale-110' : ''}`}>
                <div className="text-sm font-black text-slate-500 mb-1 tracking-widest">{playerNames?.p1 || '玩家 1'}</div>
                <div className={`text-6xl font-black ${scores.p1 > scores.p2 ? 'text-indigo-600 dark:text-indigo-400 drop-shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                  {scores.p1}
                </div>
              </div>
              <div className="text-3xl font-black text-slate-300">-</div>
              <div className={`text-center ${scores.p2 > scores.p1 ? 'scale-110' : ''}`}>
                <div className="text-sm font-black text-slate-500 mb-1 tracking-widest">{playerNames?.p2 || '玩家 2'}</div>
                <div className={`text-6xl font-black ${scores.p2 > scores.p1 ? 'text-rose-600 dark:text-rose-400 drop-shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                  {scores.p2}
                </div>
              </div>
            </div>
          )}
          
          {!isSingle && (
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-8 uppercase tracking-widest">
              {scores.p1 === scores.p2 ? '平手！' : `${scores.p1 > scores.p2 ? (playerNames?.p1 || '玩家 1') : (playerNames?.p2 || '玩家 2')} 獲勝！`}
            </div>
          )}
        </div>

        {groupedWrongs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 flex items-center bg-rose-200 dark:bg-rose-900 dark:text-rose-100 border-4 border-slate-900 px-4 py-2 w-fit rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Frown className="w-8 h-8 mr-3 text-rose-600 dark:text-rose-400" />
              錯題回顧 ({groupedWrongs.length} 題)
            </h2>
            <div className="space-y-6">
              {groupedWrongs.map((gw, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
                  {!isSingle && (
                    <div className="absolute -top-4 -right-4 flex flex-col items-end gap-2">
                      {gw.attempts.map((att, idx) => (
                        <div key={idx} className="text-sm font-black text-white bg-rose-600 px-4 py-1 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                          {att.playerName || `玩家 ${att.player}`} 答錯
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="font-bold text-xl mb-4 text-slate-900 dark:text-slate-100 leading-relaxed pr-16">
                    {gw.question.id}. {gw.question.text}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                      const isCorrect = opt === gw.question.answer;
                      const wasChosen = gw.attempts.some(att => att.chosenId === opt);
                      
                      return (
                        <div key={opt} className={`p-4 rounded-xl text-base border-2 font-bold ${
                          isCorrect 
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 text-emerald-800 dark:text-emerald-100'
                            : wasChosen 
                              ? 'bg-rose-100 dark:bg-rose-900/60 border-rose-500 text-rose-800 dark:text-rose-100 line-through opacity-80'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400'
                        }`}>
                          ({opt}) {gw.question.options[opt]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {wrongAnswers.length === 0 && (
          <div className="text-center py-8 text-emerald-700 dark:text-emerald-300 font-black text-2xl bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl border-4 border-emerald-500 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-8">
            太猛了吧！全對！沒有任何錯題！🎉
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-16 border-t-4 border-slate-900 dark:border-slate-700 pt-8 flex-wrap">
          <button
            onClick={onRestart}
            className="flex-1 py-5 bg-white dark:bg-slate-800 border-4 border-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xl transition-transform flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            <RotateCcw className="w-6 h-6 mr-3" />
            再玩一次
          </button>
          
          {wrongAnswers.length > 0 && onRetestWrong && (
            <button
              onClick={onRetestWrong}
              className="flex-1 py-5 bg-rose-400 dark:bg-rose-600 border-4 border-slate-900 hover:bg-rose-500 dark:hover:bg-rose-700 text-slate-900 dark:text-white rounded-2xl font-black text-xl transition-transform flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none min-w-[200px]"
            >
              <RotateCcw className="w-6 h-6 mr-3" />
              僅重測錯題
            </button>
          )}

          <button
            onClick={onHome}
            className="flex-1 py-5 bg-indigo-600 border-4 border-slate-900 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl transition-transform flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            <Home className="w-6 h-6 mr-3" />
            回首頁
          </button>
        </div>
      </div>
    </div>
  );
}
