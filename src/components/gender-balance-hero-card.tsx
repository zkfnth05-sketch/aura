'use client';

import React from 'react';
import { Crown, Sparkles, CheckCircle2, Users, ArrowRight } from 'lucide-react';
import { GenderRatioWidget } from './gender-ratio-widget';

interface GenderBalanceHeroCardProps {
  onExplore?: () => void;
  className?: string;
}

export function GenderBalanceHeroCard({ onExplore, className = '' }: GenderBalanceHeroCardProps) {
  return (
    <div className={`w-full max-w-md mx-auto p-5 rounded-3xl bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.12)] backdrop-blur-xl text-left relative overflow-hidden ${className}`}>
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          국내 최초 50:50 성비 보장 라운지
        </span>
        <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          AURA Equilibrium
        </span>
      </div>

      {/* Main Title */}
      <h2 className="text-xl font-extrabold text-white tracking-tight leading-snug">
        남초 현상 제로, <br />
        <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
          남녀 50:50 완벽 균형 매칭
        </span>
      </h2>

      {/* Core Explanation */}
      <p className="mt-2 text-xs text-zinc-300/90 leading-relaxed">
        AURA는 남성이 90%에 달하는 기존 소개팅 앱의 성비 붕괴 문제를 해결하기 위해,
        <strong className="text-amber-300 font-semibold"> 남녀 성비를 50:50으로 엄격히 유지</strong>하는 최고급 프라이빗 라운지입니다.
      </p>

      {/* Embedded Live Gender Bar */}
      <div className="mt-4 mb-4">
        <GenderRatioWidget />
      </div>

      {/* 2 Key Admission Rules */}
      <div className="space-y-2 text-xs pt-1">
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
          <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-300">여성 회원: 100% 프리패스</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">성비 평형 유지를 위해 여성 가입자는 대기 없이 즉시 무료 프리패스로 입장합니다.</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
          <Users className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-cyan-300">남성 회원: VIP 대기열 & 여사친 초대 패스</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">50:50 비율 유지를 위해 대기 순번이 배정되며, <strong>여사친 1명 초대 시 즉시 0순위 프리패스</strong>로 입장됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
