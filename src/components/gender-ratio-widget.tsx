'use client';

import React, { useEffect, useState } from 'react';
import { fetchGenderEquilibriumRatio } from '@/lib/supabaseDataService';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface GenderRatioWidgetProps {
  compact?: boolean;
  className?: string;
}

export function GenderRatioWidget({ compact = false, className = '' }: GenderRatioWidgetProps) {
  const { t } = useLanguage();
  const [ratioData, setRatioData] = useState<{
    malePercent: number;
    femalePercent: number;
    isEquilibrium: boolean;
    statusLabel: string;
  }>({
    malePercent: 50,
    femalePercent: 50,
    isEquilibrium: true,
    statusLabel: '50:50 Equilibrium',
  });

  useEffect(() => {
    fetchGenderEquilibriumRatio().then(setRatioData).catch(() => {});
  }, []);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-emerald-500/30 shadow-sm backdrop-blur-md ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-semibold tracking-wide text-zinc-300">
          {t('gender_male_label')} <span className="text-cyan-400 font-bold">{ratioData.malePercent}%</span> : {t('gender_female_label')} <span className="text-rose-400 font-bold">{ratioData.femalePercent}%</span>
        </span>
        <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">
          ({t('gender_balance_label')})
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-xl backdrop-blur-lg ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            50:50 Gender Equilibrium
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{t('gender_realtime_qa')}</span>
        </div>
      </div>

      {/* Dynamic Dual Neon Bar */}
      <div className="relative w-full h-3.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800/80 flex shadow-inner">
        {/* Male section (Cyan / Blue gradient) */}
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 rounded-l-full transition-all duration-700 relative group"
          style={{ width: `${ratioData.malePercent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Center Golden Divider Pin */}
        <div className="w-1 h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] z-10 -mx-0.5 rounded-full" />

        {/* Female section (Rose / Magenta gradient) */}
        <div
          className="h-full bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600 rounded-r-full transition-all duration-700 relative group"
          style={{ width: `${ratioData.femalePercent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Labels below */}
      <div className="flex justify-between items-center mt-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-zinc-400">{t('gender_male_label')}</span>
          <span className="text-cyan-400 font-extrabold">{ratioData.malePercent}%</span>
        </div>
        
        <span className="text-[11px] text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded-full border border-zinc-800">
          {t('gender_balance_label')}
        </span>

        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-rose-400 font-extrabold">{ratioData.femalePercent}%</span>
          <span className="text-zinc-400">{t('gender_female_label')}</span>
          <span className="w-2 h-2 rounded-full bg-rose-400" />
        </div>
      </div>
    </div>
  );
}
