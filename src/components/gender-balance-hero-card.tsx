'use client';

import React from 'react';
import { Crown, Sparkles, CheckCircle2, Users, ArrowRight } from 'lucide-react';
import { GenderRatioWidget } from './gender-ratio-widget';
import { useLanguage } from '@/contexts/language-context';

interface GenderBalanceHeroCardProps {
  onExplore?: () => void;
  className?: string;
}

export function GenderBalanceHeroCard({ onExplore, className = '' }: GenderBalanceHeroCardProps) {
  const { t } = useLanguage();

  return (
    <div className={`w-full max-w-md mx-auto p-5 rounded-3xl bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.12)] backdrop-blur-xl text-left relative overflow-hidden ${className}`}>
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          {t('gender_badge')}
        </span>
        <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          AURA Equilibrium
        </span>
      </div>

      {/* Main Title */}
      <h2 className="text-xl font-extrabold text-white tracking-tight leading-snug">
        <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
          {t('gender_headline')}
        </span>
      </h2>

      {/* Core Explanation */}
      <p className="mt-2 text-xs text-zinc-300/90 leading-relaxed">
        {t('gender_description')}
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
            <span className="font-bold text-rose-300">{t('gender_female_pass')}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">{t('gender_female_desc')}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
          <Users className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-cyan-300">{t('gender_male_pass')}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">{t('gender_male_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
