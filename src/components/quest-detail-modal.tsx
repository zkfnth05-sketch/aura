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

interface QuestDetailModalProps {
  quest: QuestPin | null;
  currentUser: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestDeleted?: (questId: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  coffee: { label: '커피/카페', icon: Coffee },
  food: { label: '맛집 탐방', icon: Utensils },
  drink: { label: '가벼운 한잔', icon: Wine },
  walk: { label: '산책/러닝', icon: Footprints },
  activity: { label: '놀거리/전시', icon: Sparkles },
};

export default function QuestDetailModal({
  quest,
  currentUser,
  open,
  onOpenChange,
  onQuestDeleted,
}: QuestDetailModalProps) {
  const { toast } = useToast();
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

  const catInfo = CATEGORY_LABELS[quest.category] || { label: '번개', icon: Zap };
  const CategoryIcon = catInfo.icon;

  // Handle 1:1 Chat Start
  const handleStartChat = async () => {
    if (!currentUser) {
      router.push('/signup');
      return;
    }

    setIsLoading(true);
    try {
      const matchId = await startQuestChat(currentUser.id, quest.creatorId, quest.title);
      toast({
        title: '🎉 1:1 대화방 연결!',
        description: `${creator?.name || '호스트'}님과의 대화방으로 이동합니다.`,
      });
      onOpenChange(false);
      router.push(`/chat/${matchId}`);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '대화 연결 실패',
        description: err?.message || '대화방을 여는 중 문제가 발생했습니다.',
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
          title: '퀘스트 삭제 완료',
          description: '지도에서 번개 핀이 정상적으로 제거되었습니다.',
        });
        onQuestDeleted?.(quest.id);
        onOpenChange(false);
      } else {
        throw new Error('삭제 실패');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '삭제 오류',
        description: '퀘스트를 삭제하지 못했습니다. 다시 시도해주세요.',
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
              <span>{catInfo.label}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{remainingHours}시간 뒤 자동 소멸</span>
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
                {creator?.name || '호스트'}
              </h4>
              {creator?.age && (
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
                  {creator.age}세
                </span>
              )}
              {creator?.gender && (
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
                  {creator.gender}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {creator?.bio || '새로운 인연과의 즐거운 만남을 기대해요!'}
            </p>
          </div>
        </div>

        {/* Quest Details Body */}
        <div className="space-y-3 text-sm py-1">
          {quest.meetupTime && (
            <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/50 text-xs">
              <span className="text-zinc-500 font-semibold">희망 시간:</span>
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
            <span>500m 안심 지터링이 적용되어 실제 상세 주소는 공개되지 않습니다.</span>
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
                  퀘스트 삭제 중...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  내가 올린 번개 퀘스트 삭제하기
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
                  대화방 연결 중...
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  1:1 대화 시작하기
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
