'use client';

import React, { useState, useRef } from 'react';
import { useUser } from '@/contexts/user-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Sparkles, Send, ShieldCheck, VenetianMask as Mask } from 'lucide-react';
import { LoungeStore } from '@/lib/lounge-store';
import { ANONYMOUS_AVATAR } from '@/lib/lounge-types';
import { useToast } from '@/hooks/use-toast';

const POPULAR_TAGS = ['일상', '익명고민', '카페', '오운완', '반려견', '맛집', '데이트', '오늘의무드'];

export function LoungeComposer({ onPostCreated }: { onPostCreated?: () => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['일상']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleAnonymous = () => {
    const next = !isAnonymous;
    setIsAnonymous(next);
    if (next) {
      if (!selectedTags.includes('익명고민')) {
        setSelectedTags(['익명고민', ...selectedTags.filter(t => t !== '일상')]);
      }
      toast({
        title: '🎭 익명 모드 활성화',
        description: '프로필 사진과 실명이 숨겨지며, 안전하게 속마음을 나눌 수 있습니다.',
      });
    } else {
      setSelectedTags(selectedTags.filter(t => t !== '익명고민'));
      if (selectedTags.length === 0) setSelectedTags(['일상']);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '용량 초과',
        description: '사진 용량은 5MB 이하만 업로드 가능합니다.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      }
    } else {
      if (selectedTags.length < 3) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleSubmit = () => {
    if (!content.trim() && !selectedImage) {
      toast({
        variant: 'destructive',
        description: '내용이나 사진을 입력해 주세요.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      LoungeStore.createPost({
        userId: user?.id || 'guest',
        userName: isAnonymous ? '익명의 오라' : (user?.name || '나'),
        userAvatar: isAnonymous
          ? ANONYMOUS_AVATAR
          : (user?.photoUrls?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'),
        userAge: user?.age || 26,
        userGender: (user?.gender as any) || '여성',
        userLocation: user?.location || '서울',
        content: content.trim(),
        imageUrls: selectedImage ? [selectedImage] : [],
        tags: selectedTags,
        isAnonymous,
        anonymousAlias: isAnonymous ? '익명의 오라' : undefined,
      });

      setContent('');
      setSelectedImage(null);
      setIsAnonymous(false);
      setSelectedTags(['일상']);
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast({
        title: isAnonymous ? '🎭 익명 고민 등록 완료' : '✨ 라운지 등록 완료',
        description: isAnonymous
          ? '프로필이 철저히 보호되며 라운지 고민소에 전달되었습니다.'
          : '소중한 일상이 라운지에 공유되었습니다!',
      });

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: '글 등록 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarUrl = isAnonymous
    ? ANONYMOUS_AVATAR
    : (user?.photoUrls?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');

  return (
    <div
      id="lounge-composer"
      className={`w-full bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border ${
        isAnonymous ? 'border-purple-500/50 shadow-[0_4px_24px_rgba(168,85,247,0.15)]' : 'border-amber-500/30 shadow-[0_4px_24px_rgba(229,169,52,0.12)]'
      } rounded-3xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden mb-6 transition-all duration-300`}
    >
      {/* Decorative glow */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${
          isAnonymous ? 'bg-purple-500/15' : 'bg-amber-500/10'
        } rounded-full blur-2xl pointer-events-none transition-all duration-300`}
      />

      {/* Composer Section Header */}
      <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {isAnonymous ? (
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Mask className="w-3.5 h-3.5 text-purple-400" />
              익명 속마음·연애 고민소
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              내 일상 공유하기
            </span>
          )}
          <span className="text-[11px] text-zinc-400">
            · {isAnonymous ? '철저한 비밀 보장' : `${user?.name || '회원'}님의 이야기`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAnonymous}
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all ${
              isAnonymous
                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60'
            }`}
          >
            <Mask className="w-3.5 h-3.5 text-purple-400" />
            <span>{isAnonymous ? '🎭 익명 모드 ON' : '🎭 익명 등록'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Avatar className={`w-10 h-10 border ${isAnonymous ? 'border-purple-500/60' : 'border-amber-500/40'} shadow-sm flex-shrink-0 mt-0.5`}>
          <AvatarImage src={avatarUrl} alt={isAnonymous ? '익명' : (user?.name || 'User')} className="object-cover" />
          <AvatarFallback className="bg-zinc-800 text-amber-300 font-bold">
            {isAnonymous ? '?' : (user?.name?.[0] || 'A')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isAnonymous
                ? '누구에게도 말 못 한 연애 고민이나 솔직한 속마음을 털어놓아 보세요. 프로필은 완벽히 비밀로 보호됩니다...'
                : '오늘 어떤 하루를 보내셨나요? 사진과 함께 남겨보세요...'
            }
            rows={3}
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm sm:text-base text-white placeholder:text-zinc-500 resize-none leading-relaxed"
          />

          {/* Image Preview */}
          {selectedImage && (
            <div className="relative mt-2 mb-3 inline-block">
              <img
                src={selectedImage}
                alt="Upload preview"
                className="max-h-60 rounded-2xl object-cover border border-amber-500/30 shadow-md"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-all shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hashtag Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-3 border-t border-zinc-800/60">
            <span className="text-[11px] text-zinc-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> 태그:
            </span>
            {POPULAR_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="lounge-image-upload"
              />
              <label
                htmlFor="lounge-image-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium cursor-pointer transition-all active:scale-95"
              >
                <ImagePlus className="w-4 h-4 text-amber-400" />
                <span>사진 첨부</span>
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !selectedImage)}
              className="h-9 px-4 rounded-full bg-gradient-to-r from-[#E5A934] to-[#C98718] hover:from-[#F0B746] hover:to-[#D49425] text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>게시</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
