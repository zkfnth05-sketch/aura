'use client';

import React from 'react';
import { Sparkles, Users, ArrowRight } from 'lucide-react';

interface VipWaitingBannerProps {
  queuePosition?: number;
  onOpenInviteModal: () => void;
  className?: string;
}

export function VipWaitingBanner({
  queuePosition = 1,
  onOpenInviteModal,
  className = '',
}: VipWaitingBannerProps) {
  return (
    <div
      onClick={onOpenInviteModal}
      className={`w-full cursor-pointer bg-gradient-to-r from-amber-500/20 via-zinc-900 to-rose-500/20 border-y border-amber-500/30 px-4 py-2 flex items-center justify-between shadow-lg backdrop-blur-md transition-all hover:bg-amber-500/25 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-extrabold text-amber-300">
            ⏳ 대기중 [{queuePosition}번째]
          </span>
          <span className="text-zinc-400 hidden sm:inline">|</span>
          <span className="text-zinc-300 font-medium hidden sm:inline">
            여사친 1명 초대 시 즉시 0순위 프리패스
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 group">
        <span>초대하고 바로 열기</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}
