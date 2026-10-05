'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ShieldCheck, Share2, Copy, Check, MessageCircle, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

interface VipWaitingTicketProps {
  queuePosition?: number;
  referralCode?: string;
  userName?: string;
}

export function VipWaitingTicket({
  queuePosition = 1,
  referralCode = 'AURA-VIP',
  userName,
}: VipWaitingTicketProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const displayName = userName || t('vip_member_default');

  // 초대 링크 URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aura-ai-dating.vercel.app';
  const inviteUrl = `${origin}/?ref=${referralCode}`;
  const shareMessage = t('queue_share_message_template')
    .replace('%s', referralCode)
    .replace('%s', inviteUrl);

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      }
      setCopied(true);
      toast({
        title: t('queue_ticket_copy_toast_title'),
        description: t('queue_ticket_copy_toast_desc'),
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Code: ${referralCode}`,
      });
    }
  };

  const handleKakaoShare = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any)
        .share({
          title: 'AURA 50:50',
          text: shareMessage,
          url: inviteUrl,
        })
        .then(() => {
          toast({
            title: t('queue_ticket_share_toast_title'),
            description: t('queue_ticket_share_toast_desc'),
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
            <span>{t('queue_ticket_realtime_assign')}</span>
          </div>
        </div>

        {/* ① 대기 순번 하이라이트 */}
        <div className="py-4 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-zinc-300">{t('queue_ticket_current_pos')}</span>
            <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-rose-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(229,169,52,0.4)]">
              [ #{queuePosition} ]
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed pl-6 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{t('queue_ticket_female_enter_desc')}</span>
          </p>
        </div>

        {/* ② 50:50 성비 보장 안내 뱃지 */}
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 flex items-start gap-2.5 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed font-medium">
            {t('queue_ticket_principle')}
          </p>
        </div>

        {/* ③ ⚡ 즉시 프리패스 탈출 유도 (친구 초대) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-rose-950/40 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-300">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{t('queue_ticket_invite_female_prompt')}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-xs">
            <span className="text-zinc-400 font-medium">{t('queue_ticket_my_code')}</span>
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
              <span>{t('queue_ticket_share_btn')}</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full h-10 rounded-xl border-amber-500/30 bg-zinc-900/80 hover:bg-zinc-800 text-amber-300 font-bold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('queue_ticket_copied') : t('queue_ticket_copy_btn')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
