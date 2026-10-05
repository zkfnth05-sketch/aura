'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, MessageCircle, Trash2, Zap, MapPin, Loader2, Coffee, Utensils, Wine, Footprints, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { deleteQuestPin, startQuestChat } from '@/lib/supabaseDataService';
import type { QuestPin, User } from '@/lib/types';
import { cn } from '@/lib/utils';

import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';

interface QuestDetailModalProps {
  quest: QuestPin | null;
  currentUser: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestDeleted?: (questId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  coffee: Coffee,
  food: Utensils,
  drink: Wine,
  walk: Footprints,
  activity: Sparkles,
};

export default function QuestDetailModal({
  quest,
  currentUser,
  open,
  onOpenChange,
  onQuestDeleted,
}: QuestDetailModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { requireActiveAdmission } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!quest) return null;

  const isMyQuest = currentUser?.id === quest.creatorId;
  const creator = quest.creator;

  // Calculate remaining time
  const remainingHours = Math.max(
    0,
    Math.round((new Date(quest.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
  );

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'coffee': return t('quest_cat_coffee');
      case 'food': return t('quest_cat_food');
      case 'drink': return t('quest_cat_drink');
      case 'walk': return t('quest_cat_walk');
      case 'activity': return t('quest_cat_activity');
      default: return category;
    }
  };

  const CategoryIcon = CATEGORY_ICONS[quest.category] || Zap;

  // Handle 1:1 Chat Start
  const handleStartChat = async () => {
    if (!currentUser) {
      router.push('/signup');
      return;
    }

    // 대기 중인 남성 유저는 1:1 대화 불가 (VIP 모달 발동)
    const allowed = requireActiveAdmission(() => {}, t('feature_chat_and_match'));
    if (!allowed) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      const matchId = await startQuestChat(currentUser.id, quest.creatorId, quest.title);
      toast({
        title: t('quest_chat_connected_title'),
        description: t('quest_chat_connected_desc').replace('%s', creator?.name || t('quest_host')),
      });
      onOpenChange(false);
      router.push(`/chat/${matchId}`);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('quest_chat_fail_title'),
        description: err?.message || t('quest_chat_fail_title'),
      });
      setIsLoading(false);
    }
  };

  // Handle Quest Deletion
  const handleDeleteQuest = async () => {
    if (!currentUser || !isMyQuest) return;

    setIsDeleting(true);
    try {
      const success = await deleteQuestPin(quest.id, currentUser.id);
      if (success) {
        toast({
          title: t('quest_delete_success'),
          description: t('quest_delete_desc'),
        });
        onQuestDeleted?.(quest.id);
        onOpenChange(false);
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('quest_delete_error_title'),
        description: t('quest_delete_error_desc'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border border-zinc-800 text-white p-6 rounded-3xl shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-semibold">
              <CategoryIcon className="w-3.5 h-3.5" />
              <span>{getCategoryLabel(quest.category)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{remainingHours}{t('quest_hours_left')}</span>
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-left leading-tight text-white">
            {quest.title}
          </DialogTitle>
        </DialogHeader>

        {/* Creator Info Card */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3.5 my-1">
          <Avatar className="w-14 h-14 border-2 border-primary shadow-md">
            <AvatarImage src={creator?.photoUrls?.[0]} alt={creator?.name} className="object-cover" />
            <AvatarFallback className="bg-zinc-800 text-white font-bold">
              {creator?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-base truncate">
                {creator?.name || t('quest_host')}
              </h4>
              {creator?.age && (
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
                  {creator.age}
                </span>
              )}
              {creator?.gender && (
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
                  {creator.gender}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {creator?.bio || ''}
            </p>
          </div>
        </div>

        {/* Quest Details Body */}
        <div className="space-y-3 text-sm py-1">
          {quest.meetupTime && (
            <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/50 text-xs">
              <span className="text-zinc-500 font-semibold">{t('quest_preferred_time')}</span>
              <span className="text-white font-bold">{quest.meetupTime}</span>
            </div>
          )}

          {quest.description && (
            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/40 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {quest.description}
            </div>
          )}

          {/* Safety Notice */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-1">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span>{t('quest_safety_jitter')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          {isMyQuest ? (
            <Button
              onClick={handleDeleteQuest}
              disabled={isDeleting}
              variant="destructive"
              className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-500/20"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('quest_deleting')}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>{t('quest_delete_btn')}</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStartChat}
              disabled={isLoading}
              className="w-full h-13 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-primary/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('quest_chat_connecting')}</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <span>{t('quest_start_chat')}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
