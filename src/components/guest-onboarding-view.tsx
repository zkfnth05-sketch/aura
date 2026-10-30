'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { FlagIcon } from '@/components/ui/flag-icon';
import { GenderBalanceHeroCard } from '@/components/gender-balance-hero-card';
import { Sparkles } from 'lucide-react';

interface GuestOnboardingViewProps {
  onStart: (gender: '남성' | '여성') => void;
}

export default function GuestOnboardingView({ onStart }: GuestOnboardingViewProps) {
  const { t, setLanguage, supportedLanguages, language } = useLanguage();
  const [selectedGender, setSelectedGender] = useState<'남성' | '여성'>('남성');

  const handleStart = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_guest_gender', selectedGender);
    }
    onStart(selectedGender);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white px-4 py-8 sm:p-8">
      {/* 1. 상단 다국어 선택 바 */}
      <div className="w-full text-center pt-[20px] sm:pt-[40px]">
        <p className="mb-3 text-xs text-neutral-400">
          Hello, welcome to Aura Ai Dating. Please select your preferred language below.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
          {supportedLanguages.map(lang => (
            <Button
              key={lang.code}
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(lang.code as any)}
              className={cn(
                "gap-1.5 text-xs h-8",
                language === lang.code && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <FlagIcon code={lang.code} className="w-4 h-auto rounded-sm" />
              <span>{lang.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 2. Aura 로고 및 프로모션 안내 */}
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full max-w-sm">
        <span className="font-headline text-5xl sm:text-6xl font-extrabold bg-gradient-to-b from-[#FFF3D1] via-[#E5A934] to-[#B3791B] bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(229,169,52,0.4)] scale-y-[.85]">
          {t('app_title')}
        </span>

        <div className="mt-3.5 mb-2 inline-flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-pink-500/40 rounded-full py-1.5 px-4 shadow-[0_0_20px_rgba(236,72,153,0.35)]">
          <span className="text-base">💖</span>
          <span className="text-xs sm:text-sm font-black tracking-wider text-white">{t('promo_badge_title')}</span>
          <span className="text-xs sm:text-sm font-bold text-pink-400 pl-2.5 border-l border-white/25">{t('promo_badge_sub')}</span>
        </div>
        <p className="mb-6 text-xs sm:text-sm font-bold text-amber-200/95 leading-relaxed tracking-tight px-2 break-keep">
          {t('promo_hero_line1')}<br className="sm:hidden" />
          <span className="text-white font-extrabold sm:ml-1">{t('promo_hero_line2')}</span>
        </p>

        {/* 3. 50:50 성비 균형 보장제 공식 카드 */}
        <div className="w-full mb-6">
          <GenderBalanceHeroCard />
        </div>

        {/* 4. 본인 성별 선택 칩 (남성 / 여성) */}
        <div className="w-full mb-4">
          <p className="text-xs font-semibold text-neutral-300 mb-2.5 text-center">
            {t('guest_select_gender_prompt')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedGender('남성')}
              className={cn(
                "py-3.5 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                selectedGender === '남성'
                  ? "bg-gradient-to-r from-blue-900/40 to-amber-900/40 border-amber-400 text-white shadow-[0_0_15px_rgba(229,169,52,0.3)] ring-1 ring-amber-400/50"
                  : "bg-zinc-900/70 border-zinc-800 text-neutral-400 hover:text-white hover:border-zinc-700"
              )}
            >
              <span className="text-lg">🙋‍♂️</span>
              <span>{t('gender_male')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGender('여성')}
              className={cn(
                "py-3.5 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                selectedGender === '여성'
                  ? "bg-gradient-to-r from-pink-900/40 to-amber-900/40 border-amber-400 text-white shadow-[0_0_15px_rgba(229,169,52,0.3)] ring-1 ring-amber-400/50"
                  : "bg-zinc-900/70 border-zinc-800 text-neutral-400 hover:text-white hover:border-zinc-700"
              )}
            >
              <span className="text-lg">🙋‍♀️</span>
              <span>{t('gender_female')}</span>
            </button>
          </div>
        </div>

        {/* 5. 1초 만에 바로 시작하기 메인 버튼 */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#E5A934] via-[#F3C258] to-[#C98718] text-black font-extrabold text-base shadow-[0_4px_24px_rgba(229,169,52,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <Sparkles className="w-5 h-5 fill-current" />
          <span>{t('guest_start_now')}</span>
        </button>
      </div>

      <div className="text-center text-[11px] text-neutral-600 mt-6 max-w-sm">
        {t('guest_onboarding_notice')}
      </div>
    </div>
  );
}
