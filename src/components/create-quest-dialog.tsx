'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Clock, Zap, Coffee, Utensils, Wine, Footprints, Sparkles, Loader2, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createQuestPin, sendRadarPushToNearbyUsers, fetchUserProfile } from '@/lib/supabaseDataService';
import type { QuestCategory, QuestPin, User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

interface CreateQuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  currentUser?: User | null;
  currentLat: number;
  currentLng: number;
  onQuestCreated: (newQuest: QuestPin) => void;
}

const CATEGORIES: { id: QuestCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'coffee', label: '커피/카페', icon: Coffee },
  { id: 'food', label: '맛집 탐방', icon: Utensils },
  { id: 'drink', label: '가벼운 한잔', icon: Wine },
  { id: 'walk', label: '산책/러닝', icon: Footprints },
  { id: 'activity', label: '놀거리/전시', icon: Sparkles },
];

const PRESETS = [
  '퇴근 후 성수동에서 가볍게 커피 한잔 ☕',
  '오늘 저녁 인생 맛집 같이 가실 분 🍽️',
  '가볍게 맥주나 와인 한잔 어때요? 🍷',
  '선선한 저녁 한강 산책 메이트 구해요 🏃',
];

export default function CreateQuestDialog({
  open,
  onOpenChange,
  creatorId,
  currentUser,
  currentLat,
  currentLng,
  onQuestCreated,
}: CreateQuestDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [category, setCategory] = useState<QuestCategory>('coffee');
  const [title, setTitle] = useState('');
  const [meetupTime, setMeetupTime] = useState(t('quest_default_time'));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!meetupTime) {
      setMeetupTime(t('quest_default_time'));
    }
  }, [t]);

  const presets = [
    t('quest_preset_1'),
    t('quest_preset_2'),
    t('quest_preset_3'),
    t('quest_preset_4'),
  ];

  const timePresets = [
    t('quest_time_preset_1'),
    t('quest_time_preset_2'),
    t('quest_time_preset_3'),
    t('quest_time_preset_4'),
  ];

  const getCategoryLabel = (id: QuestCategory) => {
    switch (id) {
      case 'coffee': return t('quest_cat_coffee');
      case 'food': return t('quest_cat_food');
      case 'drink': return t('quest_cat_drink');
      case 'walk': return t('quest_cat_walk');
      case 'activity': return t('quest_cat_activity');
      default: return id;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: '제목 입력',
        description: '어떤 번개인지 제목을 입력해주세요.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const quest = await createQuestPin({
        creatorId,
        title: title.trim(),
        category,
        description: description.trim(),
        meetupTime: meetupTime.trim(),
        realLat: currentLat || 37.5665,
        realLng: currentLng || 126.978,
      });

      if (quest) {
        toast({
          title: '⚡ 번개 퀘스트 등록 완료!',
          description: '지도에 24시간 동안 번개 핀이 노출됩니다.',
        });
        onQuestCreated(quest);
        onOpenChange(false);
        setTitle('');
        setDescription('');

        // ⚡ [반경 5km 실시간 번개 레이더 푸시] 발송 (남성 -> 5km 여성, 여성 -> 5km 남성)
        try {
          let userObj = currentUser;
          if (!userObj && creatorId) {
            userObj = await fetchUserProfile(creatorId);
          }
          if (userObj) {
            const radarResult = await sendRadarPushToNearbyUsers({
              questPin: quest,
              creator: userObj,
              radiusKm: 5,
            });
            if (radarResult.targetCount > 0) {
              const isMale = userObj.gender === '남성' || userObj.gender?.toLowerCase().startsWith('m');
              const targetGenderStr = isMale ? '여성' : '남성';
              toast({
                title: '⚡ 5km 번개 레이더 발송 완료!',
                description: `반경 5km 이내의 ${targetGenderStr} 회원 ${radarResult.targetCount}명에게 실시간 번개 푸시가 전파되었습니다!`,
              });
            }
          }
        } catch (pushErr) {
          console.error('Radar push error:', pushErr);
        }
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: err?.message || '퀘스트 등록 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border border-zinc-800 text-white p-6 rounded-3xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <span className="p-2 rounded-xl bg-primary/20 text-primary">
              <Zap className="w-5 h-5 fill-current" />
            </span>
            {t('quest_create_title')}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            {t('quest_create_desc')}
          </DialogDescription>
        </DialogHeader>

        {/* Safety & Privacy Guide Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{t('quest_privacy_title')}</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {t('quest_privacy_desc')}
          </p>
          <div className="flex items-center gap-1.5 text-zinc-400 pt-0.5 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{t('quest_privacy_24h')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-pink-400 pt-0.5 text-[11px]">
            <Radio className="w-3.5 h-3.5 text-pink-400 flex-shrink-0 animate-pulse" />
            <span>{t('quest_radar_desc')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Category Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">{t('quest_category_label')}</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all gap-1',
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{getCategoryLabel(cat.id)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Quick Titles */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">{t('quest_chips_label')}</label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 text-[11px] px-2.5 py-1 rounded-full transition-colors truncate max-w-full text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1 block">{t('quest_title_input_label')}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('quest_title_placeholder')}
              className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-sm focus-visible:ring-primary"
              maxLength={60}
              required
            />
          </div>

          {/* Meetup Time with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">{t('quest_time_label')}</label>
              <span className="text-[11px] text-zinc-500">{t('quest_time_hint')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {timePresets.map((timePreset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMeetupTime(timePreset)}
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-full border transition-all',
                    meetupTime === timePreset
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {timePreset}
                </button>
              ))}
            </div>
            <Input
              value={meetupTime}
              onChange={(e) => setMeetupTime(e.target.value)}
              placeholder={t('quest_time_placeholder')}
              className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 text-sm focus-visible:ring-primary"
              required
            />
          </div>

          {/* Activity Content (만나서 뭘 할 건지) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">{t('quest_desc_label')}</label>
              <span className="text-[11px] text-zinc-500">{t('quest_desc_hint')}</span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('quest_desc_placeholder')}
              className="bg-zinc-900 border-zinc-800 text-white rounded-xl text-sm min-h-[75px] focus-visible:ring-primary leading-relaxed"
              maxLength={200}
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/30 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('quest_submitting')}
              </>
            ) : (
              t('quest_create_submit')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
