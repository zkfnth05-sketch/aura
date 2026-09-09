
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { generateVipReferralCode, getNextQueuePosition, redeemFemaleReferral } from '@/lib/supabaseDataService';

export default function CreateProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, updateUser, authUser, isLoaded, setIsSignupFlowActive, isSignupFlowActive } = useUser();
  const { language, t } = useLanguage();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<'여성' | '남성'>('여성');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // URL 또는 localStorage에서 저장된 초대 코드 자동 불러오기
    if (typeof window !== 'undefined') {
      const savedCode = localStorage.getItem('aura_referred_by_code');
      if (savedCode) {
        setReferralCodeInput(savedCode);
      }
    }
  }, []);

  useEffect(() => {
    // This effect handles routing logic based on the user's state.
    if (isLoaded) {
      if (!authUser) {
        // Not authenticated, should be on the initial signup page.
        router.replace('/signup');
      } else if (user) {
         // If user object exists but we are not in signup flow, go home.
        // This can happen on a page refresh if the user object loads first.
        // But if they are in signup flow, we let them stay.
        if (!isSignupFlowActive) {
            router.replace('/');
        }
      } else {
        // Authenticated but no profile, this is the correct page.
        // Mark that we are in the signup flow.
        setIsSignupFlowActive(true);
        // Pre-fill name from auth if available.
        setName(prev => prev || authUser.displayName || '');
      }
    }
  }, [isLoaded, authUser, user, router, setIsSignupFlowActive, isSignupFlowActive]);

  const handleNext = async () => {
    if (!name || !age || !city) {
      toast({
        variant: "destructive",
        title: t('profile_creation_toast_title'),
        description: t('profile_creation_toast_desc'),
      });
      return;
    }
    if (!authUser) {
        toast({
            variant: "destructive",
            title: t('auth_error_title'),
            description: t('auth_error_desc'),
        });
        return;
    }

    setIsSubmitting(true);

    const myReferralCode = generateVipReferralCode();
    let admissionStatus: 'active' | 'queued' = 'active';
    let queuePos: number | undefined = undefined;

    if (gender === '여성') {
      admissionStatus = 'active'; // 여성은 100% 즉시 프리패스
      if (referralCodeInput.trim()) {
        // 초대한 남성 유저의 대기열 즉시 해제 & 웹 푸시 발송!
        try {
          const res = await redeemFemaleReferral(authUser.uid, referralCodeInput.trim());
          if (res.success) {
            toast({
              title: '🎟️ 초대 코드 적용 완료!',
              description: `${res.inviterName || '초대 회원'}님의 대기열 프리패스가 승인되었습니다.`,
            });
          }
        } catch (e) {
          console.error("Failed to redeem referral:", e);
        }
      }
    } else {
      // 남성 회원
      if (referralCodeInput.trim()) {
        admissionStatus = 'active'; // 초대 코드 소지 시 즉시 프리패스
      } else {
        admissionStatus = 'queued'; // 50:50 대기열 배정
        queuePos = await getNextQueuePosition();
      }
    }
    
    const userData: Partial<User> & { createdAt: any } = {
      name,
      age: parseInt(age, 10),
      location: city,
      gender,
      language: language,
      phoneNumber: authUser.phoneNumber || '',
      id: authUser.uid,
      email: authUser.email || '',
      hobbies: ['hobbies_section_title_reading', 'hobbies_section_title_movies'],
      interests: ['interests_section_title_foodie', 'interests_section_title_cafe'],
      bio: t('bio_placeholder'),
      lat: 37.5665,
      lng: 126.9780,
      createdAt: "serverTimestamp" as any,
      admissionStatus,
      queuePosition: queuePos,
      referralCode: myReferralCode,
      referredBy: referralCodeInput.trim() || undefined,
      lastAppOpenedAt: new Date().toISOString(),
    };
    
    try {
      // 성별 등 기본 정보 저장이 완벽히 끝날 때까지 기다린 후 다음 페이지로 넘깁니다.
      await updateUser(userData);
      router.push(`/signup/photo?gender=${gender}`);
    } catch(error) {
      console.error("Failed to start user update:", error);
      toast({
        variant: "destructive",
        title: t('error_title'),
        description: t('profile_update_failed_desc'),
      });
      setIsSubmitting(false); // Only re-enable if navigation fails
    }
  };

  // Show a loader until the initial auth check is complete.
  // Or if the user should be somewhere else.
  if (!isLoaded || !authUser || (user && !isSignupFlowActive)) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-8 py-12">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-center">{t('create_profile_title')}</h1>
        <Progress value={25} className="w-full mt-4 h-1 bg-zinc-800" />
      </header>

      <main className="flex-1 overflow-y-auto py-8">
        <div className="space-y-8">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-zinc-400">
              {t('name_label')}
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('name_placeholder')}
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="age" className="text-sm font-medium text-zinc-400">
              {t('age_label')}
            </label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={t('age_placeholder')}
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="city" className="text-sm font-medium text-zinc-400">
              {t('city_label')}
            </label>
            <Input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('city_placeholder')}
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400">{t('gender_label')}</label>
            <div className="mt-2 grid grid-cols-2 gap-px bg-zinc-800 rounded-lg border border-zinc-800 overflow-hidden">
              <Button
                onClick={() => setGender('여성')}
                variant={gender === '여성' ? 'default' : 'ghost'}
                disabled={isSubmitting}
                className={cn(
                  'h-12 text-base rounded-none',
                  gender === '여성'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                )}
              >
                {t('gender_female')}
              </Button>
              <Button
                onClick={() => setGender('남성')}
                variant={gender === '남성' ? 'default' : 'ghost'}
                disabled={isSubmitting}
                className={cn(
                  'h-12 text-base rounded-none',
                  gender === '남성'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                )}
              >
                {t('gender_male')}
              </Button>
            </div>
          </div>

          {/* VIP Referral Code Input */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="referralCode" className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <span>🎟️</span>
                <span>{gender === '여성' ? '초대 코드 입력 (지인 선물)' : '여사친 초대 코드 (프리패스)'}</span>
              </label>
              <span className="text-[11px] text-zinc-400 font-medium">선택 사항</span>
            </div>
            <Input
              id="referralCode"
              type="text"
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
              placeholder={gender === '여성' ? '남사친의 초대 코드 (예: AURA-7K9B)' : '여사친 초대 코드 (예: AURA-7K9B)'}
              className="bg-black/60 border-amber-500/30 font-mono tracking-wider h-11 text-amber-200 placeholder:text-zinc-600 uppercase"
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-zinc-400 leading-normal">
              {gender === '여성'
                ? '💡 나를 초대한 남성의 코드를 입력하면 해당 회원에게 즉시 VIP 대기열 프리패스가 선물됩니다.'
                : '💡 여사친의 초대 코드를 입력하면 50:50 대기열 없이 즉시 프리패스로 정회원 입장합니다.'}
            </p>
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 pt-8">
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('next_button')}
        </Button>
      </footer>
    </div>
  );
}
