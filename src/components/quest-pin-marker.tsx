'use client';

import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { QuestPin } from '@/lib/types';
import { Coffee, Utensils, Wine, Footprints, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

interface QuestPinMarkerProps {
  quest: QuestPin;
  isMyQuest: boolean;
  onClick: (quest: QuestPin) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgGradient: string;
    neonColor: string;
    border: string;
  }
> = {
  coffee: {
    icon: Coffee,
    bgGradient: 'from-amber-500 to-orange-600',
    neonColor: 'shadow-[0_0_15px_rgba(245,158,11,0.6)]',
    border: 'border-amber-400',
  },
  food: {
    icon: Utensils,
    bgGradient: 'from-rose-500 to-red-600',
    neonColor: 'shadow-[0_0_15px_rgba(244,63,94,0.6)]',
    border: 'border-rose-400',
  },
  drink: {
    icon: Wine,
    bgGradient: 'from-purple-500 to-indigo-600',
    neonColor: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    border: 'border-purple-400',
  },
  walk: {
    icon: Footprints,
    bgGradient: 'from-emerald-500 to-teal-600',
    neonColor: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]',
    border: 'border-emerald-400',
  },
  activity: {
    icon: Sparkles,
    bgGradient: 'from-cyan-500 to-blue-600',
    neonColor: 'shadow-[0_0_15px_rgba(6,182,212,0.6)]',
    border: 'border-cyan-400',
  },
};

export const QuestPinMarker = React.memo(function QuestPinMarker({
  quest,
  isMyQuest,
  onClick,
}: QuestPinMarkerProps) {
  const { t } = useLanguage();
  if (typeof quest.approxLat !== 'number' || typeof quest.approxLng !== 'number') return null;

  const config = CATEGORY_CONFIG[quest.category] || {
    icon: Zap,
    bgGradient: 'from-primary to-orange-500',
    neonColor: 'shadow-[0_0_15px_rgba(255,100,50,0.6)]',
    border: 'border-primary',
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'coffee': return t('quest_cat_coffee');
      case 'food': return t('quest_cat_food');
      case 'drink': return t('quest_cat_drink');
      case 'walk': return t('quest_cat_walk');
      case 'activity': return t('quest_cat_activity');
      default: return '';
    }
  };

  const Icon = config.icon;

  // Calculate remaining hours
  const remainingHours = Math.max(
    0,
    Math.round((new Date(quest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <AdvancedMarker
      position={{ lat: quest.approxLat, lng: quest.approxLng }}
      onClick={() => onClick(quest)}
    >
      <div className="relative group cursor-pointer select-none transition-transform duration-200 hover:scale-110 will-change-transform z-30">
        {/* Pulsing Neon Halo */}
        <span
          className={cn(
            'absolute -inset-1.5 rounded-full opacity-60 animate-ping duration-1000 pointer-events-none',
            isMyQuest ? 'bg-primary' : config.neonColor
          )}
        />

        {/* Main Marker Badge */}
        <div
          className={cn(
            'relative flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border-2 text-white shadow-xl transition-all',
            isMyQuest ? 'border-primary ring-2 ring-primary/40' : config.border,
            config.neonColor
          )}
        >
          {/* Creator Avatar or Category Icon */}
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-white bg-gradient-to-tr overflow-hidden flex-shrink-0',
              config.bgGradient
            )}
          >
            {quest.creator?.photoUrls?.[0] ? (
              <Image
                src={quest.creator.photoUrls[0]}
                alt={quest.creator.name}
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Title & Badge */}
          <div className="flex flex-col items-start pr-1 max-w-[120px]">
            <span className="text-xs font-bold text-white truncate w-full leading-tight">
              {quest.title}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-zinc-300">
              <span className="font-semibold text-primary">⚡ {getCategoryLabel(quest.category)}</span>
              <span>•</span>
              <span className="text-zinc-400">{t('quest_hours_left_short').replace('{hours}', String(remainingHours))}</span>
            </div>
          </div>
        </div>
      </div>
    </AdvancedMarker>
  );
});
