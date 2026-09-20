'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ShieldCheck, Share2, Copy, Check, MessageCircle, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VipWaitingTicketProps {
  queuePosition?: number;
  referralCode?: string;
  userName?: string;
}

export function VipWaitingTicket({
  queuePosition = 1,
  referralCode = 'AURA-VIP',
  userName = '회원',
}: VipWaitingTicketProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // 초대 링크 URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aura-ai-dating.vercel.app';
  const inviteUrl = `${origin}/?ref=${referralCode}`;
  const shareMessage = `[AURA] 성비 50:50 철저 보장 프라이빗 데이팅 라운지 AURA에 초대합니다! ✨\n제 초대 코드 [${referralCode}]로 가입하시면 여성 VIP 프리패스로 즉시 입장됩니다.\n👉 입장 링크: ${inviteUrl}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      }
      setCopied(true);
      toast({
        title: '📋 초대 링크 복사 완료',
        description: '친구에게 공유하여 즉시 VIP 프리패스로 입장하세요!',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        variant: 'destructive',
        title: '복사 실패',
        description: `초대 코드: ${referralCode}`,
      });
    }
  };

  const handleKakaoShare = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any)
        .share({
          title: 'AURA 50:50 데이팅 초대',
          text: shareMessage,
          url: inviteUrl,
        })
        .then(() => {
          toast({
            title: '✨ 초대장 발송 완료',
            description: '여성 지인이 가입하면 대기열이 즉시 풀립니다!',
          });
        })
        .catch(() => {
          handleCopyLink();
        });
      return;
    }

    handleCopyLink();
  };

  return (
    <div className="w-full max-w-lg mx-auto mb-4 px-3 sm:px-0">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-zinc-900/95 via-neutral-950/95 to-zinc-950/95 p-5 sm:p-6 shadow-[0_0_35px_rgba(229,169,52,0.18)] backdrop-blur-2xl text-left">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Badge & Live Indicator */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400">
              <Crown className="w-4 h-4" />
            </span>
            <span className="font-extrabold text-xs tracking-wider uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Aura 50:50 VIP Waiting Ticket
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>대기열 실시간 배정</span>
          </div>
        </div>

        {/* ① 대기 순번 하이라이트 */}
        <div className="py-4 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-zinc-300">⏳ 현재 내 대기 순번:</span>
            <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-rose-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(229,169,52,0.4)]">
              [ {queuePosition}번째 ]
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed pl-6 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>여성 회원이 입장할 때마다 실시간으로 순번이 줄어듭니다.</span>
          </p>
        </div>

        {/* ② 50:50 성비 보장 안내 뱃지 */}
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 flex items-start gap-2.5 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed font-medium">
            남녀 50:50 철저한 성비 균형 원칙에 따라 정직하게 입장 순서를 지켜드립니다.
          </p>
        </div>

        {/* ③ ⚡ 즉시 프리패스 탈출 유도 (친구 초대) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-rose-950/40 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-300">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>기다리기 지루하신가요? 여성 지인 1명 초대 시 즉시 VIP 프리패스 입장!</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-xs">
            <span className="text-zinc-400 font-medium">내 초대 코드</span>
            <span className="font-mono font-black text-amber-300 tracking-wider text-sm">
              {referralCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              onClick={handleKakaoShare}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-black" />
              <span>카카오톡으로 초대장 보내기</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full h-10 rounded-xl border-amber-500/30 bg-zinc-900/80 hover:bg-zinc-800 text-amber-300 font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨!' : '초대 링크 복사'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
