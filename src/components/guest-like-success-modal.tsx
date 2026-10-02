'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, ArrowRight, ShieldCheck, MessageCircle, RefreshCw } from 'lucide-react';
import type { User } from '@/lib/types';

interface GuestLikeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  onResetStack?: () => void;
  actionType?: 'like' | 'message' | 'complete';
}

export function GuestLikeSuccessModal({
  isOpen,
  onClose,
  targetUser,
  onResetStack,
  actionType = 'like',
}: GuestLikeSuccessModalProps) {
  const router = useRouter();

  const handleGoSignup = () => {
    if (targetUser && typeof window !== 'undefined') {
      localStorage.setItem('aura_liked_target_id', targetUser.id);
      localStorage.setItem('aura_liked_target_name', targetUser.name);
      if (targetUser.photoUrls?.[0]) {
        localStorage.setItem('aura_liked_target_photo', targetUser.photoUrls[0]);
      }
    }
    router.push('/signup');
  };

  const handleBrowseMore = () => {
    onClose();
    if (onResetStack) {
      onResetStack();
    }
  };

  const photoUrl = targetUser?.photoUrls?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';
  const userName = targetUser?.name || '이상형 회원';
  const userAge = targetUser?.age || 25;
  const userLocation = targetUser?.location?.replace('서울특별시 ', '').replace('경기 ', '') || '서울 강남';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-950/95 border border-amber-500/40 text-white p-6 shadow-[0_16px_50px_rgba(229,169,52,0.25)] backdrop-blur-2xl rounded-3xl overflow-hidden text-left">
        {/* Ambient Glow Effects */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="text-center pt-1">
          {/* Target Profile Thumbnail with Pulsing Heart */}
          <div className="relative mx-auto mb-3.5">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-[0_0_24px_rgba(229,169,52,0.4)] relative mx-auto">
              <Image
                src={photoUrl}
                alt={userName}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 border-2 border-zinc-950 flex items-center justify-center shadow-lg animate-bounce">
              {actionType === 'message' ? (
                <MessageCircle className="w-4 h-4 text-white fill-current" />
              ) : (
                <Heart className="w-4 h-4 text-white fill-current" />
              )}
            </div>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span className="bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] bg-clip-text text-transparent">
              💖 {userName}님에게 호감을 보냈습니다!
            </span>
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
            <strong className="text-amber-300 font-bold">{userName}({userAge}세, {userLocation})</strong>님이 회원님의 호감을 확인하면 <strong>실시간 1:1 대화방</strong>이 즉시 열립니다.
          </DialogDescription>
        </DialogHeader>

        {/* Benefits Card */}
        <div className="my-4 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-zinc-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span><strong>남녀 50:50 성비 보장</strong> (유령 회원 없는 100% 실명 인증 네트워크)</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-200">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span><strong>{userName}님과의 매칭 수락 알림</strong>을 스마트폰으로 즉시 전송</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <Button
            onClick={handleGoSignup}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-extrabold text-sm sm:text-base shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>✨ 1초 만에 알림 받고 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            onClick={handleBrowseMore}
            className="w-full h-10 rounded-full text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>다른 이상형 프로필 더보기</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
