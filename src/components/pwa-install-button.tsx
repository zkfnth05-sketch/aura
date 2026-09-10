'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, PlusSquare, CheckCircle2, Smartphone, X } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallButton() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // 2. Check if iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    setIsIos(isIosDevice);

    // 3. Listen for PWA beforeinstallprompt on Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      toast({
        title: t('install_app_toast_title'),
        description: t('install_app_toast_desc'),
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [t, toast]);

  // If already installed and running as an app, do not render the install button
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isInApp = /kakaotalk|instagram|fbav|fban|line|naver|twitter|tiktok|snapchat|micromessenger/.test(ua);
    const isAndroidDevice = /android/.test(ua);

    // 1. 안드로이드 인앱(인스타/카톡)인 경우: 설명창 없이 즉시 구글 크롬으로 강제 점프!
    if (isInApp && isAndroidDevice) {
      const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
      window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // 2. iOS 인앱인 경우: 사파리 열기 및 홈 화면 추가 안내 모달 표시
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    // 3. 브라우저 네이티브 PWA 설치 프롬프트가 준비된 경우 (가장 이상적)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsStandalone(true);
          setDeferredPrompt(null);
          toast({
            title: t('install_app_toast_title'),
            description: t('install_app_toast_desc'),
          });
        }
      } catch (err) {
        console.error('Error invoking PWA install prompt:', err);
      }
      return;
    }

    // 4. 안드로이드 일반 브라우저에서 프롬프트 대기 중일 때: 크롬 앱으로 직접 연결
    if (isAndroidDevice) {
      const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
      window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // 5. PC 데스크톱 환경 등 기타 브라우저: 안내 모달
    setShowGenericGuide(true);
  };

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="h-8 px-2.5 rounded-full border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-yellow-500/25 to-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold gap-1.5 shadow-[0_0_10px_rgba(229,169,52,0.2)] transition-all hover:scale-105 active:scale-95 animate-pulse"
        title={t('install_app_btn')}
      >
        <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="inline">{t('install_app_btn')}</span>
      </Button>

      {/* iOS Install Guide Dialog */}
      <Dialog open={showIosGuide} onOpenChange={setShowIosGuide}>
        <DialogContent className="max-w-xs sm:max-w-sm bg-[#161616] border border-amber-500/30 text-foreground p-5 rounded-2xl">
          <DialogHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-500/30 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-amber-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-amber-300">
              {t('ios_install_title')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Safari 브라우저에서 3초 만에 홈 화면에 추가할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-card/60 border border-border/50">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Share className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xs leading-relaxed text-foreground font-medium">
                1. {t('ios_install_step1')}
              </p>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-card/60 border border-border/50">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <PlusSquare className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xs leading-relaxed text-foreground font-medium">
                2. {t('ios_install_step2')}
              </p>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-card/60 border border-border/50">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs leading-relaxed text-foreground font-medium">
                3. {t('ios_install_step3')}
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2 sm:justify-center">
            <Button
              onClick={() => setShowIosGuide(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold rounded-xl text-sm"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generic Browser Guide Dialog */}
      <Dialog open={showGenericGuide} onOpenChange={setShowGenericGuide}>
        <DialogContent className="max-w-xs sm:max-w-sm bg-[#161616] border border-amber-500/30 text-foreground p-5 rounded-2xl">
          <DialogHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-500/30 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-amber-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-amber-300">
              {t('install_app_btn')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              브라우저 메뉴에서 홈 화면에 추가할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-card/60 border border-border/50 text-xs leading-relaxed text-foreground font-medium">
            💡 브라우저 주소창 우측 또는 메뉴([⋮]) 버튼을 누른 후 <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 선택해 주세요.
          </div>

          <DialogFooter className="pt-2 sm:justify-center">
            <Button
              onClick={() => setShowGenericGuide(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold rounded-xl text-sm"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
