'use client';

import React, { useState, useEffect } from 'react';
import { useEscapeCall, ESCAPE_PERSONAS } from '@/contexts/escape-call-context';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  MicOff,
  Grid,
  Volume2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function IncomingEscapeCallModal() {
  const { isRinging, isInCall, personaKey, acceptCall, endCall } = useEscapeCall();
  const [callDuration, setCallDuration] = useState(0);

  const activePersona = ESCAPE_PERSONAS[personaKey];

  // 통화 중 타이머 (00:01, 00:02...)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isInCall) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isInCall]);

  if (!isRinging && !isInCall) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white flex flex-col justify-between p-6 sm:p-10 select-none backdrop-blur-3xl animate-in fade-in duration-300">
      {/* Top Header: Caller Info */}
      <div className="flex flex-col items-center text-center pt-8 sm:pt-12 space-y-3">
        {/* Caller Avatar */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl">
            {activePersona.avatarText}
          </div>
          {isRinging && (
            <div className="absolute inset-0 rounded-full border-4 border-pink-500/50 animate-ping" />
          )}
        </div>

        {/* Caller Name & Tag */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {activePersona.callerName}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            {activePersona.subtitle}
          </p>
        </div>

        {/* Call State Subtitle */}
        {isRinging ? (
          <div className="flex items-center gap-2 text-pink-400 text-sm font-medium animate-pulse pt-1">
            <PhoneCall className="w-4 h-4" />
            <span>수신 전화 오는 중...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono font-medium pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        )}
      </div>

      {/* Middle Content: In-Call Teleprompter Script */}
      {isInCall ? (
        <div className="my-auto max-w-md mx-auto w-full space-y-5 px-2">
          {/* Voice Playing Indicator */}
          <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-3 flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>수화기에서 실제 음성이 재생 중입니다</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
              통화 연결됨
            </span>
          </div>

          {/* Teleprompter Card */}
          <div className="bg-gradient-to-b from-amber-500/15 to-amber-900/10 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>상대방에게 이렇게 말씀하고 자연스럽게 일어나세요:</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-amber-100 leading-relaxed bg-black/40 p-3.5 rounded-2xl border border-amber-500/20">
              &ldquo;{activePersona.teleprompterScript}&rdquo;
            </p>
            <p className="text-[11px] text-amber-300/80 leading-normal">
              💡 대본을 읽은 후, 상대방에게 &ldquo;죄송해요.. 급한 일이 생겨서 먼저 가봐야 할 것 같아요 ㅠㅠ&rdquo; 하고 짐을 챙기시면 됩니다.
            </p>
          </div>

          {/* Dummy In-Call Utility Icons */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="flex flex-col items-center gap-1 text-zinc-400 text-xs">
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center">
                <MicOff className="w-5 h-5" />
              </div>
              <span>소리 끔</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-zinc-400 text-xs">
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center">
                <Grid className="w-5 h-5" />
              </div>
              <span>키패드</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-emerald-400 text-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <span>스피커</span>
            </div>
          </div>
        </div>
      ) : (
        /* While Ringing: Guidance Cue */
        <div className="my-auto max-w-sm mx-auto text-center space-y-2 px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>AURA 여성 안심 탈출 시스템 작동 중</span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            초록색 통화 버튼을 누르면 화면에 <strong>읽을 대본</strong>이 뜨고, 스피커에서 실제 다급한 목소리가 흘러나옵니다.
          </p>
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="pb-8 sm:pb-12 max-w-md mx-auto w-full">
        {isRinging ? (
          /* Ringing Actions: Decline vs Accept */
          <div className="flex items-center justify-around px-6">
            {/* Decline Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={endCall}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-all"
              >
                <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
              <span className="text-xs text-zinc-400 font-medium">거절</span>
            </div>

            {/* Accept Button with Glowing Pulse */}
            <div className="flex flex-col items-center gap-2 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
              <button
                type="button"
                onClick={acceptCall}
                className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all animate-bounce"
              >
                <Phone className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
              <span className="text-xs text-emerald-400 font-bold">통화 수락</span>
            </div>
          </div>
        ) : (
          /* In-Call Action: End Call */
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={endCall}
              className="w-full max-w-xs py-4 rounded-3xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 shadow-2xl shadow-red-600/40 transition-all"
            >
              <PhoneOff className="w-5 h-5" />
              <span>통화 종료 및 탈출 완료</span>
            </button>
            <span className="text-[11px] text-zinc-400">
              통화를 종료하면 화면이 닫히며 원래 페이지로 돌아갑니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
