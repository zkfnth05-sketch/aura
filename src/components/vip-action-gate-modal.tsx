'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Copy, Check, MessageCircle, AlertCircle, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VipActionGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  queuePosition?: number;
  referralCode?: string;
  actionTitle?: string;
}

export function VipActionGateModal({
  isOpen,
  onClose,
  queuePosition = 1,
  referralCode = 'AURA-VIP',
  actionTitle = '1:1 대화 및 매칭',
}: VipActionGateModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // 초대 링크 URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aura-ai-dating.com';
  const inviteUrl = `${origin}/?ref=${referralCode}`;
  const shareMessage = `[AURA] 성비 50:50 철저 보장 프라이빗 데이팅 라운지 AURA에 초대합니다! ✨\n제 초대 코드 [${referralCode}]로 가입하시면 여성 VIP 프리패스로 즉시 입장됩니다.\n👉 입장 링크: ${inviteUrl}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      }
      setCopied(true);
      toast({
        title: '초대 링크 복사 완료!',
        description: '여사친에게 링크를 공유해보세요. 가입 즉시 대기열이 풀립니다.',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        variant: 'destructive',
        title: '복사 실패',
        description: '초대 코드를 직접 복사해주세요: ' + referralCode,
      });
    }
  };

  const handleKakaoShare = () => {
    // 1. Web Share API 시도
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any)
        .share({
          title: 'AURA 50:50 프라이빗 라운지 초대',
          text: shareMessage,
          url: inviteUrl,
        })
        .then(() => {
          toast({
            title: '초대장 전송 완료!',
            description: '여사친이 가입을 완료하면 실시간으로 프리패스가 발급됩니다.',
          });
        })
        .catch(() => {
          handleCopyLink();
        });
      return;
    }

    // 2. Fallback: 클립보드 복사 후 알림
    handleCopyLink();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-950/95 border-amber-500/40 text-white p-6 shadow-2xl backdrop-blur-2xl rounded-3xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="text-center pt-2">
          {/* Animated Lock Icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Lock className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>

          <DialogTitle className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>🔒 성비 50:50 프리미엄 라운지 전용</span>
          </DialogTitle>

          <DialogDescription className="text-xs text-zinc-400 mt-1">
            남녀 1:1 완벽 균형 유지를 위해 현재 관전 모드로 둘러보시는 중입니다.
          </DialogDescription>
        </DialogHeader>

        {/* Status Callout */}
        <div className="my-3 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 font-medium">
            회원님의 현재 입장 대기 순번
          </p>
          <p className="text-2xl font-black text-amber-400 tracking-wider mt-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
            대기 [{queuePosition}번째]
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            여사친 1명을 초대하시면 <span className="text-white font-semibold">{actionTitle}</span>을(를) 지금 즉시 시작할 수 있습니다!
          </p>
        </div>

        {/* Viral Referral Code Box */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">
              내 고유 VIP 초대 코드
            </span>
            <div className="text-base font-extrabold text-amber-300 font-mono tracking-widest">
              {referralCode}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs gap-1.5 h-8 px-3 rounded-lg"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '복사됨' : '코드 복사'}</span>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 mt-2">
          {/* Kakao Share / Web Share */}
          <Button
            onClick={handleKakaoShare}
            className="w-full h-12 bg-[#FEE500] text-[#191919] hover:bg-[#FDD800] font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-[#191919]" />
            카카오톡으로 여사친 초대하고 즉시 열기
          </Button>

          {/* Copy Link Button */}
          <Button
            onClick={handleCopyLink}
            variant="ghost"
            className="w-full h-10 border border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-medium text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            초대 링크 복사하기
          </Button>
        </div>

        {/* 14-Day Expiry Notice Footer */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 justify-center pt-2 border-t border-zinc-900">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0" />
          <span>성비 균형 유지를 위해 <strong>14일 동안 앱 미접속 시 대기열이 자동 만료</strong>됩니다.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
