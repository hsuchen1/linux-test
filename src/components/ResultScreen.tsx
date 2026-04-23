import React from 'react';
import { GameMode, WrongAnswer } from '../types';
import { Award, RotateCcw, Home, Frown } from 'lucide-react';

interface ResultScreenProps {
  mode: GameMode;
  scores: { p1: number, p2: number };
  total: number;
  wrongAnswers: WrongAnswer[];
  onRestart: () => void;
  onHome: () => void;
}

export function ResultScreen({ mode, scores, total, wrongAnswers, onRestart, onHome }: ResultScreenProps) {
  
  const isSingle = mode === 'single';
  
  return (
    <div className="min-h-screen bg-[#FDFCF0] py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] border-4 border-slate-900 overflow-hidden p-8 md:p-12">
        
        <div className="text-center mb-10">
          <Award className="w-24 h-24 mx-auto text-amber-500 mb-6 drop-shadow-md" />
          <h1 className="text-5xl font-black text-slate-900 mb-2 uppercase tracking-tight">練習結束</h1>
          
          {isSingle ? (
            <div className="text-3xl mt-6 font-bold bg-amber-100 border-4 border-slate-900 p-4 rounded-2xl w-fit mx-auto shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              總得分: <span className="font-black text-indigo-600">{scores.p1}</span> / {total}
            </div>
          ) : (
            <div className="mt-8 flex justify-center items-center gap-12 bg-slate-50 p-6 border-4 border-slate-900 rounded-[2rem] shadow-[inset_4px_4px_0px_0px_rgba(15,23,42,0.05)] w-fit mx-auto">
              <div className={`text-center ${scores.p1 > scores.p2 ? 'scale-110' : ''}`}>
                <div className="text-sm font-black text-slate-500 mb-1 tracking-widest">玩家 1</div>
                <div className={`text-6xl font-black ${scores.p1 > scores.p2 ? 'text-indigo-600 drop-shadow-md' : 'text-slate-700'}`}>
                  {scores.p1}
                </div>
              </div>
              <div className="text-3xl font-black text-slate-300">-</div>
              <div className={`text-center ${scores.p2 > scores.p1 ? 'scale-110' : ''}`}>
                <div className="text-sm font-black text-slate-500 mb-1 tracking-widest">玩家 2</div>
                <div className={`text-6xl font-black ${scores.p2 > scores.p1 ? 'text-rose-600 drop-shadow-md' : 'text-slate-700'}`}>
                  {scores.p2}
                </div>
              </div>
            </div>
          )}
          
          {!isSingle && (
            <div className="text-3xl font-black text-emerald-600 mt-8 uppercase tracking-widest">
              {scores.p1 === scores.p2 ? '平手！' : `玩家 ${scores.p1 > scores.p2 ? '1' : '2'} 獲勝！`}
            </div>
          )}
        </div>

        {wrongAnswers.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center bg-rose-200 border-4 border-slate-900 px-4 py-2 w-fit rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Frown className="w-8 h-8 mr-3 text-rose-600" />
              錯題回顧 ({wrongAnswers.length} 題)
            </h2>
            <div className="space-y-6">
              {wrongAnswers.map((wa, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative">
                  {!isSingle && (
                    <div className="absolute -top-4 -right-4 text-sm font-black text-white bg-rose-600 px-4 py-1 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      玩家 {wa.player} 答錯
                    </div>
                  )}
                  <div className="font-bold text-xl mb-4 text-slate-900 leading-relaxed">
                    {wa.question.id}. {wa.question.text}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <div key={opt} className={`p-4 rounded-xl text-base border-2 font-bold ${
                        opt === wa.question.answer 
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                          : opt === wa.chosenId 
                            ? 'bg-rose-100 border-rose-500 text-rose-800 line-through opacity-80'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        ({opt}) {wa.question.options[opt]}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {wrongAnswers.length === 0 && (
          <div className="text-center py-8 text-emerald-700 font-black text-2xl bg-emerald-100 rounded-2xl border-4 border-emerald-500 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] mt-8">
            太猛了吧！全對！沒有任何錯題！🎉
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-16 border-t-4 border-slate-900 pt-8">
          <button
            onClick={onRestart}
            className="flex-1 py-5 bg-white border-4 border-slate-900 hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-xl transition-transform flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            <RotateCcw className="w-6 h-6 mr-3" />
            再玩一次
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-5 bg-indigo-600 border-4 border-slate-900 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl transition-transform flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            <Home className="w-6 h-6 mr-3" />
            回首頁
          </button>
        </div>
      </div>
    </div>
  );
}
