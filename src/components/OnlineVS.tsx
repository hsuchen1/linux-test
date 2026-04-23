import React, { useState, useEffect } from 'react';
import { GameMode, Question, WrongAnswer } from '../types';
import { Home, LogIn, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, signInWithGoogle } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, updateDoc, getDoc, query, where, getDocs, limit } from 'firebase/firestore';

interface OnlineVSProps {
  allQuestions: Question[];
  questionCount: number;
  onFinish: (scores: {p1: number, p2: number}, wrongAnswers: WrongAnswer[], playerNames? : {p1: string, p2: string}) => void;
  onHome: () => void;
}

export function OnlineVS({ allQuestions, questionCount, onFinish, onHome }: OnlineVSProps) {
  const [user, setUser] = useState<User | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (roomId) {
      const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoomData(data);
          
          if (data.status === 'finished') {
            const names = { p1: data.hostName || 'Player 1', p2: data.guestName || 'Player 2' };
            onFinish({ p1: data.p1Score, p2: data.p2Score }, data.wrongAnswers || [], names);
          } else if (data.status === 'abandoned') {
            alert('對手已離開對戰，遊戲結束。');
            const names = { p1: data.hostName || 'Player 1', p2: data.guestName || 'Player 2' };
            onFinish({ p1: data.p1Score, p2: data.p2Score }, data.wrongAnswers || [], names);
          }
        }
      });
      return unsub;
    }
  }, [roomId, onFinish]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Browsers often ignore async requests here, but we can try
      if (roomId && roomData && roomData.status === 'playing') {
         // Fire and forget
         updateDoc(doc(db, 'rooms', roomId), { status: 'abandoned' }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, roomData?.status]);

  const handleCreateRoom = async () => {
    if (!user) return;
    const newRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Pick random question indices
    const indices = [...Array(allQuestions.length).keys()].sort(() => 0.5 - Math.random()).slice(0, questionCount);

    await setDoc(doc(db, 'rooms', newRoomId), {
      hostId: user.uid,
      hostName: user.displayName || 'Player 1',
      guestId: null,
      guestName: null,
      status: 'waiting',
      questionIndices: indices,
      currentIndex: 0,
      p1Score: 0,
      p2Score: 0,
      p1Answer: null,
      p2Answer: null,
      timerStart: null,
      createdAt: Date.now(),
      wrongAnswers: []
    });
    setRoomId(newRoomId);
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode) return;
    const code = joinCode.toUpperCase();
    
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
       setError('找不到此房間');
       return;
    }
    const data = snap.data();
    if (data.status !== 'waiting') {
       setError('房間已開始或已結束');
       return;
    }

    await updateDoc(roomRef, {
      guestId: user.uid,
      guestName: user.displayName || 'Player 2',
      status: 'playing'
    });
    setRoomId(code);
  };

  const handleRandomMatch = async () => {
    if (!user) return;
    setError('');
    setIsMatching(true);
    try {
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('status', '==', 'waiting'), where('isPublic', '==', true), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // join existing public room
        const docSnap = snapshot.docs[0];
        const matchRoomId = docSnap.id;
        
        await updateDoc(doc(db, 'rooms', matchRoomId), {
           guestId: user.uid,
           guestName: user.displayName || 'Player 2',
           status: 'playing',
           isPublic: false
        });
        setRoomId(matchRoomId);
      } else {
        // create new public room
        const newId = Math.random().toString(36).substring(2, 6).toUpperCase();
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, questionCount).map(q => allQuestions.indexOf(q));

        await setDoc(doc(db, 'rooms', newId), {
          hostId: user.uid,
          hostName: user.displayName || 'Player 1',
          guestId: null,
          guestName: null,
          status: 'waiting',
          currentIndex: 0,
          p1Score: 0,
          p2Score: 0,
          p1Answer: null,
          p2Answer: null,
          timerStart: null,
          questionIndices: selected,
          wrongAnswers: [],
          createdAt: Date.now(),
          isPublic: true
        });
        setRoomId(newId);
      }
    } catch (err) {
      console.error(err);
      setError('匹配時發生錯誤');
    } finally {
      setIsMatching(false);
    }
  };

  const handleSelect = async (answer: string) => {
    if (!roomData || roomData.status !== 'playing' || !user) return;
    
    const isHost = roomData.hostId === user.uid;
    const isGuest = roomData.guestId === user.uid;
    if (!isHost && !isGuest) return;

    if (isHost && roomData.p1Answer) return;
    if (isGuest && roomData.p2Answer) return;

    const updateMap: any = {};
    if (isHost) updateMap.p1Answer = answer;
    if (isGuest) updateMap.p2Answer = answer;
    
    if (!roomData.timerStart && !roomData.p1Answer && !roomData.p2Answer) {
      updateMap.timerStart = Date.now();
    }

    await updateDoc(doc(db, 'rooms', roomId), updateMap);
  };

  // 10s Timer Logic
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  useEffect(() => {
    if (!roomData) return;
    if (roomData.timerStart && !roomData.p1Answer && !roomData.p2Answer) {
      // Something weird
      return;
    }
    
    if (roomData.timerStart && (!roomData.p1Answer || !roomData.p2Answer)) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - roomData.timerStart!) / 1000);
        const remain = 10 - elapsed;
        if (remain <= 0) {
          setTimeLeft(0);
          evalAndNext(); 
        } else {
          setTimeLeft(remain);
        }
      }, 100);
      return () => clearInterval(interval);
    } else if (roomData.p1Answer && roomData.p2Answer) {
      setTimeLeft(0);
      evalAndNext();
    } else {
      setTimeLeft(null);
    }
  }, [roomData]);

  // Host evaluates when both answered or timer out
  const [evaluatingLocal, setEvaluatingLocal] = useState(false);
  const evalAndNext = async () => {
    if (!roomData || roomData.hostId !== user?.uid || evaluatingLocal) return;
    
    setEvaluatingLocal(true);
    const qIndex = roomData.questionIndices[roomData.currentIndex];
    const question = allQuestions[qIndex];

    let newP1Score = roomData.p1Score;
    let newP2Score = roomData.p2Score;
    let newWrongAnswers = roomData.wrongAnswers || [];

    if (roomData.p1Answer === question.answer) newP1Score++;
    else if (roomData.p1Answer) {
      newP1Score--;
      newWrongAnswers = [
        ...newWrongAnswers, 
        { 
          question, 
          chosenId: roomData.p1Answer, 
          player: 1, 
          uid: roomData.hostId, 
          playerName: roomData.hostName 
        }
      ];
    }

    if (roomData.p2Answer === question.answer) newP2Score++;
    else if (roomData.p2Answer) {
      newP2Score--;
      newWrongAnswers = [
        ...newWrongAnswers, 
        { 
          question, 
          chosenId: roomData.p2Answer, 
          player: 2, 
          uid: roomData.guestId, 
          playerName: roomData.guestName 
        }
      ];
    }

    setTimeout(async () => {
      const isLast = roomData.currentIndex + 1 >= roomData.questionIndices.length;
      await updateDoc(doc(db, 'rooms', roomId), {
        p1Score: newP1Score,
        p2Score: newP2Score,
        p1Answer: null,
        p2Answer: null,
        timerStart: null,
        wrongAnswers: newWrongAnswers,
        currentIndex: isLast ? roomData.currentIndex : roomData.currentIndex + 1,
        status: isLast ? 'finished' : 'playing'
      });
      setEvaluatingLocal(false);
    }, 2000); // show evaluation for 2s
  };


  const handleHomeClick = async () => {
    if (roomId && roomData && roomData.status === 'playing') {
      if (window.confirm("確定要離開嗎？此舉將直接結束這場對戰。")) {
        await updateDoc(doc(db, 'rooms', roomId), { status: 'abandoned' }).catch(() => {});
        onHome();
      }
    } else if (roomId && roomData && roomData.status === 'waiting') {
      await updateDoc(doc(db, 'rooms', roomId), { status: 'abandoned' }).catch(() => {});
      onHome();
    } else {
      onHome();
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCF0] flex flex-col items-center justify-center p-4">
         <button onClick={handleHomeClick} className="absolute top-4 left-4 bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg transition-colors border-2 border-slate-700 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-y-1 active:translate-x-1">
           <Home className="w-6 h-6" />
        </button>
        <div className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] text-center max-w-sm w-full">
           <Users className="w-20 h-20 mx-auto text-indigo-500 mb-6" />
           <h2 className="text-3xl font-black mb-2 text-slate-900">線上對戰</h2>
           <p className="text-slate-600 mb-8 font-bold">登入以建立或加入房間</p>
           <button onClick={signInWithGoogle} className="w-full py-4 bg-indigo-600 text-white border-4 border-slate-900 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-indigo-700 flex justify-center items-center gap-2">
              <LogIn className="w-5 h-5" /> Google 登入
           </button>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[#FDFCF0] flex flex-col items-center justify-center p-4">
        <button onClick={handleHomeClick} className="absolute top-4 left-4 bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg transition-colors border-2 border-slate-700 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-y-1 active:translate-x-1">
           <Home className="w-6 h-6" />
        </button>
        
        <div className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] text-center max-w-md w-full">
           <h2 className="text-3xl font-black mb-8 text-slate-900">連線大廳</h2>
           
           <button 
             onClick={handleRandomMatch} 
             disabled={isMatching}
             className="w-full py-4 mb-4 bg-indigo-500 text-white border-4 border-slate-900 rounded-2xl font-black text-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-indigo-400 disabled:opacity-75 disabled:cursor-wait flex items-center justify-center gap-2"
           >
             {isMatching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Users className="w-6 h-6" />}
             {isMatching ? '配對中...' : '隨機配對'}
           </button>

           <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t-2 border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 font-bold">與好友連線</span>
              <div className="flex-grow border-t-2 border-slate-200"></div>
           </div>

           <button onClick={handleCreateRoom} className="w-full py-4 mb-6 bg-emerald-500 text-slate-900 border-4 border-slate-900 rounded-2xl font-black text-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-emerald-400">
              建立房間
           </button>

           <div className="flex flex-col sm:flex-row gap-3">
             <input 
               type="text" 
               placeholder="輸入 4 碼房間代碼" 
               value={joinCode}
               onChange={e => setJoinCode(e.target.value)}
               maxLength={4}
               className="flex-1 px-4 py-3 border-4 border-slate-900 rounded-2xl font-black text-lg outline-none focus:bg-slate-50 uppercase text-center w-full min-w-0"
             />
             <button onClick={handleJoinRoom} className="px-6 py-3 bg-amber-400 text-slate-900 border-4 border-slate-900 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-amber-300 whitespace-nowrap shrink-0">
               加入
             </button>
           </div>
           {error && <p className="text-rose-500 font-bold mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  if (roomData && roomData.status === 'waiting') {
    return (
      <div className="min-h-screen bg-[#FDFCF0] flex flex-col items-center justify-center p-4">
        <button onClick={handleHomeClick} className="absolute top-4 left-4 bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg transition-colors border-2 border-slate-700 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-y-1 active:translate-x-1">
           <Home className="w-6 h-6" />
        </button>
        <div className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] text-center max-w-sm w-full">
           <h2 className="text-xl font-bold text-slate-500 mb-2">請對手輸入此代碼</h2>
           <div className="text-6xl font-black tracking-widest text-indigo-600 mb-8 border-4 border-slate-900 py-4 rounded-3xl bg-indigo-50 shadow-[inset_4px_4px_0px_0px_rgba(15,23,42,0.1)]">
             {roomId}
           </div>
           <p className="text-slate-600 font-bold flex items-center justify-center gap-2">
             <Loader2 className="w-5 h-5 animate-spin" /> 等待玩家加入...
           </p>
        </div>
      </div>
    );
  }

  if (!roomData || roomData.status === 'finished' || roomData.status === 'abandoned') return <div className="min-h-screen bg-[#FDFCF0]"></div>;

  const isHost = roomData.hostId === user.uid;
  const question = allQuestions[roomData.questionIndices[roomData.currentIndex]];
  const isEvaluating = !!(roomData.p1Answer && roomData.p2Answer) || (timeLeft === 0);
  const myAnswer = isHost ? roomData.p1Answer : roomData.p2Answer;
  const oppAnswer = isHost ? roomData.p2Answer : roomData.p1Answer;
  
  const progress = (roomData.currentIndex / roomData.questionIndices.length) * 100;

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex justify-between items-end mb-4 px-4 relative">
        <button onClick={handleHomeClick} className="absolute -top-12 left-4 bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg transition-colors border-2 border-slate-700 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-y-1 active:translate-x-1">
           <Home className="w-6 h-6" />
        </button>

        <div className="bg-indigo-400 text-slate-900 px-6 py-4 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] w-48 sm:w-56 relative overflow-hidden">
          {myAnswer && !isEvaluating && <div className="absolute top-0 right-0 bg-indigo-900 text-white text-xs font-black px-2 py-1 rounded-bl-lg">已鎖定</div>}
          <div className="text-sm font-black opacity-80 mb-1 line-clamp-1">{isHost ? roomData.hostName : roomData.guestName} (你)</div>
          <div className="text-4xl font-black">{isHost ? roomData.p1Score : roomData.p2Score} 分</div>
        </div>
        
        <div className="text-center pb-4 flex flex-col items-center gap-2">
           <div className={`px-4 py-1 rounded-full font-black text-slate-900 border-2 ${timeLeft !== null && timeLeft <= 3 ? 'bg-rose-400 border-rose-900 animate-pulse text-white' : 'bg-white border-slate-900'}`}>
              {timeLeft !== null && !isEvaluating ? `⏳ 剩餘 ${timeLeft} 秒` : (isEvaluating ? '判定中' : '搶答階段')}
           </div>
           <div className="text-2xl font-black text-slate-900 hidden sm:block">VS</div>
           <div className="font-bold text-slate-600">第 {roomData.currentIndex + 1} / {roomData.questionIndices.length} 題</div>
        </div>

        <div className="bg-rose-400 text-slate-900 px-6 py-4 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] w-48 sm:w-56 text-right flex flex-col items-end relative overflow-hidden">
          {oppAnswer && !isEvaluating && <div className="absolute top-0 left-0 bg-rose-900 text-white text-xs font-black px-2 py-1 rounded-br-lg">已鎖定</div>}
          <div className="text-sm font-black opacity-80 mb-1 w-full text-right line-clamp-1">{isHost ? roomData.guestName : roomData.hostName} (對手)</div>
          <div className="text-4xl font-black">{isHost ? roomData.p2Score : roomData.p1Score} 分</div>
        </div>
      </div>

      <div className="w-full max-w-4xl h-3 bg-slate-200 border-4 border-slate-900 rounded-full overflow-hidden mb-2">
        <motion.div 
          className="h-full bg-emerald-400 border-r-2 border-slate-900"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] overflow-hidden flex flex-col min-h-[400px] mt-2 max-h-[60vh] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={roomData.currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="p-6 sm:p-8 md:p-12 flex-1 flex flex-col overflow-y-auto"
          >
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-10 leading-relaxed whitespace-pre-line text-center shrink-0">
              {question.id}. {question.text}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-auto shrink-0 pb-4">
              {(['A', 'B', 'C', 'D'] as const).map((optId) => {
                const text = question.options[optId];
                const isSelectedByMe = myAnswer === optId;
                const isSelectedByOpp = oppAnswer === optId;
                const isCorrectAnswer = optId === question.answer;
                
                let btnClass = "border-4 border-slate-900 bg-white text-slate-800 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]";
                
                if (isEvaluating) {
                  if (isCorrectAnswer) btnClass = "border-4 border-emerald-500 bg-emerald-400 text-slate-900 font-black scale-[1.02] shadow-[8px_8px_0px_0px_rgba(16,185,129,1)]";
                  else if (isSelectedByMe || isSelectedByOpp) btnClass = "border-4 border-slate-900 bg-slate-200 text-slate-400 opacity-60";
                  else btnClass = "border-4 border-slate-200 bg-slate-50 text-slate-300 opacity-40";
                  
                  if (isSelectedByMe && isSelectedByOpp && !isCorrectAnswer) btnClass = "border-4 border-purple-900 bg-purple-200 text-slate-400 opacity-60";
                  else if (isSelectedByMe && !isCorrectAnswer) btnClass = "border-4 border-indigo-900 bg-indigo-100 text-slate-400 opacity-60";
                  else if (isSelectedByOpp && !isCorrectAnswer) btnClass = "border-4 border-rose-900 bg-rose-100 text-slate-400 opacity-60";
                } else {
                   if (isSelectedByMe) btnClass = "border-4 border-indigo-900 bg-indigo-200 shadow-none translate-x-[2px] translate-y-[2px]";
                   else if (!myAnswer) btnClass += " hover:bg-slate-50 active:translate-y-1 active:shadow-none cursor-pointer";
                }

                return (
                  <div
                    key={optId}
                    onClick={() => { if (!myAnswer && !isEvaluating) handleSelect(optId); }}
                    className={`p-6 rounded-[2rem] transition-all duration-300 flex flex-col items-center justify-center text-center relative ${btnClass}`}
                  >
                    {isSelectedByMe && isEvaluating && <div className="absolute top-0 left-4 max-w-fit px-3 py-1 bg-indigo-600 text-white font-black text-xs rounded-b-lg border-x-2 border-b-2 border-slate-900 shadow-md transform -translate-y-1">你的選擇</div>}
                    {isSelectedByOpp && isEvaluating && <div className="absolute top-0 right-4 max-w-fit px-3 py-1 bg-rose-500 text-white font-black text-xs rounded-b-lg border-x-2 border-b-2 border-slate-900 shadow-md transform -translate-y-1">對手選擇</div>}

                    <div className="text-lg sm:text-xl font-bold mt-2"><span className="opacity-60 mr-1">({optId})</span> {text}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {isEvaluating && (
          <div className="flex w-full text-center text-base sm:text-lg font-black border-t-4 border-slate-900 shrink-0 relative z-10">
            <div className={`flex-1 p-3 sm:p-4 border-r-4 border-slate-900 ${myAnswer === question.answer ? 'bg-emerald-400 text-slate-900' : (myAnswer ? 'bg-rose-400 text-white' : 'bg-slate-200 text-slate-500')}`}>
               你 {myAnswer === question.answer ? '正確(+1)' : (myAnswer ? '錯誤(-1)' : '未作答')}
            </div>
            <div className={`flex-1 p-3 sm:p-4 ${oppAnswer === question.answer ? 'bg-emerald-400 text-slate-900' : (oppAnswer ? 'bg-rose-400 text-white' : 'bg-slate-200 text-slate-500')}`}>
               對手 {oppAnswer === question.answer ? '正確(+1)' : (oppAnswer ? '錯誤(-1)' : '未作答')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
