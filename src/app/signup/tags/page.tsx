'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles } from 'lucide-react';
import ProfileTagsSelector, { ProfileTagValues } from '@/components/profile-tags-selector';

export default function SignupTagsPage() {
  const router = useRouter();
  const { user, updateUser, isLoaded, setIsSignupFlowActive } = useUser();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [tagValues, setTagValues] = useState<ProfileTagValues>({
    relationship: [],
    values: [],
    communication: [],
    lifestyle: [],
    hobbies: [],
    interests: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // user 로드 시 기존 태그 동기화 (초기 렌더 null로 인한 빈 배열 고착 및 유실 방지)
  useEffect(() => {
    if (user) {
      setTagValues({
        relationship: user.relationship || [],
        values: user.values || [],
        communication: user.communication || [],
        lifestyle: user.lifestyle || [],
        hobbies: user.hobbies || [],
        interests: user.interests || [],
      });
    }
  }, [user]);

  const handleTagsChange = (categoryKey: keyof ProfileTagValues, selectedKeys: string[]) => {
    setTagValues((prev) => ({
      ...prev,
      [categoryKey]: selectedKeys,
    }));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await updateUser({
        relationship: tagValues.relationship || [],
        values: tagValues.values || [],
        communication: tagValues.communication || [],
        lifestyle: tagValues.lifestyle || [],
        hobbies: tagValues.hobbies || [],
        interests: tagValues.interests || [],
      });
      setIsSignupFlowActive(false);
      toast({
        title: t('welcome_title'),
        description: t('profile_updated_desc'),
      });
      router.push('/profile');
    } catch (error) {
      console.error('Failed to save tags:', error);
      toast({
        variant: 'destructive',
        title: t('profile_update_failed_title'),
        description: t('profile_update_failed_desc'),
      });
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      setIsSignupFlowActive(false);
      router.push('/profile');
    } catch (error) {
      console.error('Failed to skip tags:', error);
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-6 py-10 max-w-lg mx-auto">
      {/* 3단계 진행 바 (100% 완료) */}
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-center">{t('create_profile_title')}</h1>
        <Progress value={100} className="w-full mt-4 h-1 bg-zinc-800" />
      </header>

      {/* 태그 선택 메인 안내 */}
      <main className="flex-1 overflow-y-auto py-6">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-zinc-100 flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{t('signup_tags_title')}</span>
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {t('signup_tags_desc')}
          </p>
        </div>

        <ProfileTagsSelector values={tagValues} onChange={handleTagsChange} />
      </main>

      {/* 하단 버튼 영역 */}
      <footer className="flex-shrink-0 pt-4 flex gap-3 border-t border-zinc-900 bg-black">
        <Button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-1/4 h-12 bg-zinc-800 text-zinc-300 font-bold rounded-full text-sm hover:bg-zinc-700"
        >
          {t('previous_button')}
        </Button>

        <Button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="w-1/4 h-12 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-full text-xs hover:text-zinc-200 hover:bg-zinc-800"
        >
          {t('skip_button')}
        </Button>

        <Button
          type="button"
          onClick={handleComplete}
          disabled={isSubmitting}
          className="w-1/2 h-12 bg-gradient-to-r from-[#E5A934] via-[#DE9F2B] to-[#C7871E] text-black font-extrabold rounded-full text-sm hover:brightness-110 shadow-[0_4px_20px_rgba(229,169,52,0.35)] transition-all flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>{t('complete_button')}</span>
        </Button>
      </footer>
    </div>
  );
}
