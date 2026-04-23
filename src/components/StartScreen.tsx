import React, { useState } from 'react';
import { GameMode } from '../types';
import { BookOpen, Monitor, Smartphone, Wifi } from 'lucide-react';

interface StartScreenProps {
  onStart: (mode: GameMode, questionCount: number) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [mode, setMode] = useState<GameMode>('single');
  const [count, setCount] = useState<number | ''>(10);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <header className="flex justify-between items-end border-b-4 border-slate-900 pb-4">
          <div className="flex flex-col">
            <span className="bg-indigo-600 text-white px-3 py-1 text-sm font-bold w-fit rounded mb-1">LINUX GS4538</span>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 uppercase">題庫 <span className="text-indigo-600">練習</span></h1>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <ModeCard
            active={mode === 'single'}
            onClick={() => setMode('single')}
            theme="amber"
            title="單人模式"
            desc="自己練習，對戰結束後可回顧錯題"
            icon={<BookOpen className="w-16 h-16 text-slate-900" />}
          />
           <ModeCard
            active={mode === 'mobile-vs'}
            onClick={() => setMode('mobile-vs')}
            theme="rose"
            title="雙人對戰 - 手機"
            desc="同台設備面對面，點擊按鈕搶答"
            icon={<Smartphone className="w-16 h-16 text-slate-900" />}
          />
          <ModeCard
            active={mode === 'desktop-vs'}
            onClick={() => setMode('desktop-vs')}
            theme="emerald"
            title="雙人對戰 - 電腦"
            desc="使用鍵盤搶答 (玩家1: QWER | 玩家2: 1234)"
            icon={<Monitor className="w-16 h-16 text-slate-900" />}
          />
          <ModeCard
            active={mode === 'online-vs'}
            onClick={() => setMode('online-vs')}
            theme="indigo"
            title="線上對戰 (雲端)"
            desc="開房輸入代碼，與朋友連線對決"
            icon={<Wifi className="w-16 h-16 text-slate-900" />}
          />
        </main>

        <footer className="h-auto md:h-24 bg-indigo-100 rounded-3xl border-2 border-slate-900 flex flex-col md:flex-row items-center p-6 md:px-8 gap-4 md:gap-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex flex-col w-full md:w-auto">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest text-center md:text-left">題數設定</span>
            <div className="flex flex-wrap gap-2 mt-1 justify-center md:justify-start">
              {[10, 20, 50].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-4 py-1 border-2 border-slate-900 rounded-lg font-black text-sm transition-all ${
                    count === n 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {n} 題
                </button>
              ))}
              <div className="flex items-center border-2 border-slate-900 rounded-lg bg-white overflow-hidden">
                <span className="px-3 py-1 font-black text-sm text-slate-700 border-r-2 border-slate-900 bg-slate-100">自訂</span>
                <input 
                  type="number" 
                  min="1" 
                  max="128" 
                  value={count} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setCount('');
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) setCount(Math.min(128, num));
                    }
                  }} 
                  className="w-16 px-2 py-1 outline-none font-bold text-sm text-center text-slate-800"
                />
              </div>
            </div>
          </div>
          <div className="hidden md:block h-12 w-px bg-slate-300"></div>
          <div className="flex-1 w-full md:w-auto mx-auto flex">
            <button
              onClick={() => onStart(mode, typeof count === 'number' && count > 0 ? count : 10)}
              className="w-full md:w-auto px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition-colors shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] ml-auto active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              立刻開始
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ModeCard({ active, onClick, title, desc, icon, theme }: { 
  active: boolean, onClick: () => void, title: string, desc: string, icon: React.ReactNode, theme: 'amber'|'rose'|'emerald'|'indigo' 
}) {
  const themes = {
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    emerald: 'bg-emerald-400',
    indigo: 'bg-indigo-400'
  };
  
  return (
    <button
      onClick={onClick}
      className={`group ${themes[theme]} rounded-[2.5rem] border-4 border-slate-900 p-6 flex flex-col items-center text-center transition-all ${
        active ? 'shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] scale-100' : 'shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] scale-95 opacity-80'
      }`}
    >
      <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-900 mb-6 flex items-center justify-center overflow-hidden">
        {icon}
      </div>
      <h2 className="text-3xl font-black mb-3 text-slate-900">{title}</h2>
      <p className="text-slate-900/80 font-bold leading-tight mb-6">{desc}</p>
      
      <div className="mt-auto w-full flex flex-col gap-3">
        <div className={`w-full py-4 rounded-2xl border-2 border-slate-900 font-bold text-lg transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
          {active ? '已選擇' : '選擇此模式'}
        </div>
      </div>
    </button>
  );
}
