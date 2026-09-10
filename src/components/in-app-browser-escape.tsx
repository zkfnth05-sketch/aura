'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';

export default function InAppBrowserEscape() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isInApp, setIsInApp] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if dismissed in this session
    if (sessionStorage.getItem('aura_inapp_dismissed') === 'true') {
      setIsDismissed(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const inAppDetected = /kakaotalk|instagram|fbav|fban|line|naver|twitter|tiktok|snapchat|micromessenger/.test(ua);
    const androidDetected = /android/.test(ua);
    const iosDetected = /iphone|ipad|ipod/.test(ua);

    setIsInApp(inAppDetected);
    setIsAndroid(androidDetected);
    setIsIos(iosDetected);

    if (inAppDetected && androidDetected) {
      // Automatic Chrome Intent Escape for Android
      const hasTriedAutoEscape = sessionStorage.getItem('aura_android_intent_escaped');
      if (!hasTriedAutoEscape) {
        sessionStorage.setItem('aura_android_intent_escaped', 'true');
        const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
        window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      }
    }
  }, []);

  if (!isInApp || isDismissed) {
    return null;
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: t('inapp_escape_copy'),
        description: t('inapp_escape_copied'),
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleOpenChrome = () => {
    const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
    window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('aura_inapp_dismissed', 'true');
  };

  return (
    <div className="sticky top-0 z-[100] w-full bg-[#18150f]/95 border-b border-amber-500/40 backdrop-blur-md px-3.5 py-2.5 shadow-xl animate-in slide-in-from-top duration-300">
      <div className="max-w-screen-sm mx-auto flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1">
                {t('inapp_escape_title')}
                {isIos && <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 animate-bounce" />}
              </p>
              <p className="text-[11px] text-amber-100/80 leading-tight pt-0.5">
                {t('inapp_escape_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-amber-300/60 hover:text-amber-300 p-1 rounded-full hover:bg-amber-500/10 transition-colors"
            title={t('inapp_escape_dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pl-8">
          {isAndroid && (
            <Button
              size="sm"
              onClick={handleOpenChrome}
              className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              {t('inapp_escape_open_chrome')}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="h-7 px-2.5 rounded-lg border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium"
          >
            {copied ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? '복사됨!' : t('inapp_escape_copy')}
          </Button>
          <button
            onClick={handleDismiss}
            className="text-[11px] text-muted-foreground hover:text-amber-200 ml-auto pr-1"
          >
            {t('inapp_escape_dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
