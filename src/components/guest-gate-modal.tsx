'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ShieldCheck, Heart, ArrowRight, BookOpen } from 'lucide-react';

interface GuestGateModalProps {
  isOpen: boolean;
  onClose?: () => void;
  featureName?: string;
}

export function GuestGateModal({
  isOpen,
  onClose,
  featureName = '정회원 전용 서비스',
}: GuestGateModalProps) {
  const router = useRouter();

  const handleGoSignup = () => {
    router.push('/signup');
  };

  const handleGoLounge = () => {
    if (onClose) {
      onClose();
    }
    router.push('/lounge');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleGoLounge()}>
      <DialogContent className="sm:max-w-md bg-zinc-950/95 border-amber-500/40 text-white p-6 shadow-2xl backdrop-blur-2xl rounded-3xl overflow-hidden text-left">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="text-center pt-2">
          {/* Animated Crown Icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(229,169,52,0.3)]">
            <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>

          <DialogTitle className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>👑 Aura 정회원 전용 공간입니다</span>
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
            <strong className="text-amber-300 font-bold">{featureName}</strong> 서비스는 남녀 50:50 성비 보장 Aura 정회원에게만 제공됩니다.
          </DialogDescription>
        </DialogHeader>

        {/* Value Proposition Cards */}
        <div className="space-y-2.5 my-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">남녀 50:50 철저한 성비 균형</p>
              <p className="text-[11px] text-zinc-400">한쪽 성별만 몰리지 않는 정직하고 건강한 데이팅</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">100% 실명 인증 회원 매칭</p>
              <p className="text-[11px] text-zinc-400">유령 회원 없는 신뢰할 수 있는 2030 솔로 네트워크</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 flex-shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">AI 취향 분석 & 맞춤 데이트 코스</p>
              <p className="text-[11px] text-zinc-400">두 사람의 분위기에 맞춘 최적의 만남 설계</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <Button
            onClick={handleGoSignup}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-extrabold text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <span>✨ 지금 3초 만에 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            onClick={handleGoLounge}
            className="w-full h-10 rounded-full text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            <span>비회원 둘러보기 (라운지로 돌아가기)</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
