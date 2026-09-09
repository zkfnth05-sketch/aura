
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Loader2, UserX } from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import ActionButtons from '@/components/action-buttons';
import { getAIRecommendationReason } from '@/actions/ai-actions';
import { fetchUserProfile, recordSwipe, submitUserReport, getClient } from '@/lib/supabaseDataService';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { TranslationKeys } from '@/lib/locales';


// Helper components for page structure
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-4">
    <h3 className="font-semibold text-primary text-sm mb-3">{title}</h3>
    {children}
  </div>
);

const AIReasonComponent = ({ currentUser, potentialMatch }: { currentUser: User, potentialMatch: User }) => {
  const [aiReason, setAiReason] = useState<string | null>(null);
  const [isAiReasonLoading, setIsAiReasonLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchReason = async () => {
      setIsAiReasonLoading(true);
      try {
        const potentialMatchWithDefaults = {
          ...potentialMatch,
          hobbies: potentialMatch.hobbies || [],
          interests: potentialMatch.interests || [],
          values: potentialMatch.values || [],
          communication: potentialMatch.communication || [],
          lifestyle: potentialMatch.lifestyle || [],
        };
        const currentUserWithDefaults = {
          ...currentUser,
          hobbies: currentUser.hobbies || [],
          interests: currentUser.interests || [],
          values: currentUser.values || [],
          communication: currentUser.communication || [],
          lifestyle: currentUser.lifestyle || [],
        };
        
        // Remove non-serializable fields if they exist
        delete (potentialMatchWithDefaults as Partial<User>).createdAt;
        delete (currentUserWithDefaults as Partial<User>).createdAt;
        
        const languageMap: { [key: string]: string } = { ko: 'Korean', en: 'English', es: 'Spanish', ja: 'Japanese' };

        const result = await getAIRecommendationReason({ 
            currentUser: currentUserWithDefaults, 
            potentialMatch: potentialMatchWithDefaults,
            targetLanguage: languageMap[language] || 'Korean'
        });
        setAiReason(result.reason);
      } catch (error) {
        console.error("Failed to get AI recommendation reason:", error);
        setAiReason(t('ai_rec_reason_failed'));
      } finally {
        setIsAiReasonLoading(false);
      }
    }
    fetchReason();
  }, [currentUser, potentialMatch, t, language]);

  return (
    <div className="my-6 bg-primary/5 border border-primary/30 rounded-lg p-4 min-h-[120px] flex flex-col relative">
        <h3 className="flex items-center font-semibold text-primary text-sm">
            <Sparkles className="h-4 w-4 mr-2 text-primary/80" />
            {t('ai_rec_reason_title')}
        </h3>
        <div className="flex-grow flex items-center justify-center pt-2">
            {isAiReasonLoading ? (
                <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/80 mx-auto" />
                    <p className="text-sm text-foreground/70 mt-2">{t('ai_rec_reason_loading')}</p>
                </div>
            ) : (
                <p className="text-sm text-foreground/80 text-center">{aiReason}</p>
            )}
        </div>
    </div>
  )
}

function UserProfilePageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const source = searchParams.get('from');
  const { toast } = useToast();
  const { t } = useLanguage();

  const { user: currentUser, isLoaded, matches, peopleILiked, updateUser, swipeUser, requireActiveAdmission } = useUser();
  
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    setIsUserLoading(true);
    fetchUserProfile(userId).then(u => {
      if (isMounted) {
        setUser(u);
        setIsUserLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsUserLoading(false);
    });
    return () => { isMounted = false; };
  }, [userId]);
  
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [reportReason, setReportReason] = useState("");
  const reportReasons = ["spam", "explicit", "scam", "harassment", "mismatch", "other"];

  const isAlreadyMatched = useMemo(() => {
    if (!matches || !user) return null;
    return matches.find(m => m.users.includes(user.id)) || null;
  }, [matches, user]);

  const hasLiked = useMemo(() => {
    if (!peopleILiked || !user) return false;
    return peopleILiked.some(u => u.id === user.id);
  }, [peopleILiked, user]);


  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!user || !currentUser) return;

    // 대기 중인 남성 유저는 관전만 가능하며 좋아요/메시지 시도시 VIP 모달 발동!
    if (action === 'like' || action === 'message') {
      const allowed = requireActiveAdmission(() => {}, action === 'like' ? '프로필 좋아요' : '1:1 메시지 전송');
      if (!allowed) return;
    }

    const targetUserId = user.id;

    if (action === 'message') {
      if (isAlreadyMatched) {
        router.push(`/chat/${isAlreadyMatched.id}`);
        return;
      }

      // Deterministic match ID for users
      const matchId = [currentUser.id, targetUserId].sort().join('_');
      const now = new Date().toISOString();
      const matchData = {
        id: matchId,
        users: [currentUser.id, targetUserId],
        last_message: t('new_match_start_message'),
        last_message_timestamp: now,
        last_message_sender_id: 'system',
        unread_counts: { [currentUser.id]: 0, [targetUserId]: 1 },
        call_status: 'idle',
        caller_id: null,
        match_date: now,
      };

      try {
        await getClient().from('matches').upsert(matchData, { onConflict: 'id' });
        await swipeUser(user, true);
      } catch (e) {
        console.error('Failed to create match:', e);
      }
      router.push(`/chat/${matchId}`);
      return;
    }

    try {
      await swipeUser(user, action === 'like');
    } catch (e) {
      console.error('Failed to record swipe:', e);
    }
  
    router.back();
  };

  const handleBlock = () => {
    if (!currentUser || !user) return;

    const newBlockedList = [...(currentUser.blockedUsers || []), user.id];
    updateUser({ blockedUsers: newBlockedList });

    toast({
        title: t('block_success_title'),
        description: (t('block_success_desc') || '').replace('%s', user?.name || ''),
    });
    router.back();
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast({
        variant: "destructive",
        title: t('report_select_reason'),
      });
      return;
    }
    if (!currentUser || !user) return;
  
    try {
      await submitUserReport({
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        reportedUserId: user.id,
        reportedUserName: user.name,
        reason: reportReason,
      });
  
      toast({
        title: t('report_submitted_title'),
        description: t('report_submitted_desc'),
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        variant: "destructive",
        title: t('report_failed_title'),
        description: t('report_failed_desc'),
      });
    }
  };

  if (isUserLoading || !isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center text-center p-4">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">{t('user_profile_not_found_title')}</h1>
            <p className="text-muted-foreground mt-2">{t('user_profile_not_found_subtitle')}</p>
            <Button onClick={() => router.back()} className="mt-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('back_button')}
            </Button>
        </div>
    );
  }

  const allPhotos = user.photoUrls && user.photoUrls.length > 0 ? user.photoUrls : [];

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsCarouselOpen(true);
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 p-4 bg-background/80 backdrop-blur-sm">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
        </header>
        <main className="flex-1 pb-40">
          <div className="relative w-full aspect-[3/4] max-h-[70vh] cursor-pointer" onClick={() => handleImageClick(0)}>
            {allPhotos[0] && (
              <Image
                src={allPhotos[0]}
                alt={`Profile of ${user.name}`}
                fill
                className="object-cover"
                data-ai-hint="person portrait"
                priority
              />
            )}
          </div>
          
          <div className="container relative z-10 px-4">
            <div className="grid grid-cols-3 gap-2 mt-4">
                {allPhotos.slice(1).map((photoUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden cursor-pointer" onClick={() => handleImageClick(index + 1)}>
                        <Image 
                            src={photoUrl}
                            alt={`More photo of ${user.name} ${index + 1}`}
                            fill
                            className="object-cover"
                            data-ai-hint="person portrait"
                        />
                    </div>
                ))}
            </div>
            <div className="text-left mt-4">
                <h1 className="text-3xl font-bold">
                    {user.name}, {user.age}, {t(user.gender as TranslationKeys) || user.gender}
                </h1>
                <p className="text-muted-foreground">{user.location}</p>
            </div>
          </div>

          <div className="container relative z-10 px-4 mt-6">
            {source === 'ai' && currentUser && <AIReasonComponent currentUser={currentUser} potentialMatch={user} />}
            <div className="bg-card p-4 rounded-lg">

              <ProfileSection title={t('bio_section_title')}>
                <p className="text-sm text-foreground/80">{user.bio}</p>
              </ProfileSection>

              {user.relationship && user.relationship.length > 0 && (
                <ProfileSection title={t('relationship_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {user.relationship.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {user.values && user.values.length > 0 && (
                <ProfileSection title={t('values_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {user.values.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {user.communication && user.communication.length > 0 && (
                <ProfileSection title={t('communication_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {user.communication.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {user.lifestyle && user.lifestyle.length > 0 && (
                <ProfileSection title={t('lifestyle_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {user.lifestyle.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {user.interests && user.interests.length > 0 && (
                <ProfileSection title={t('interests_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map(interest => (
                      <Badge key={interest} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(interest as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}
              
              {user.hobbies && user.hobbies.length > 0 && (
                <ProfileSection title={t('hobbies_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {user.hobbies.map(hobby => (
                      <Badge key={hobby} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(hobby as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}
            </div>
          </div>
          <div className="container px-4 my-8 flex items-center gap-2">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                          {t('block_user_button')}
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>{t('block_confirm_title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                          {t('block_confirm_desc')}
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBlock} className={cn(buttonVariants({ variant: "destructive" }))}>
                          {t('block_user_button')}
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {t('report_user_button')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{(t('report_confirm_title') || '').replace('%s', user?.name || '')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('report_confirm_desc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <RadioGroup value={reportReason} onValueChange={setReportReason} className="py-2 space-y-2">
                    {reportReasons.map((reasonKey) => (
                      <div key={reasonKey} className="flex items-center space-x-2">
                        <RadioGroupItem value={t(`report_reason_${reasonKey}` as TranslationKeys)} id={`r-${reasonKey}`} />
                        <Label htmlFor={`r-${reasonKey}`} className="font-normal">{t(`report_reason_${reasonKey}` as TranslationKeys)}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setReportReason("")}>{t('cancel_button')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReport} disabled={!reportReason}>
                      {t('report_user_button')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
        </main>
        <footer className="fixed bottom-24 left-0 right-0 z-20">
            <div className="flex justify-center">
                <ActionButtons 
                    onDislike={() => handleAction('dislike')}
                    onMessage={() => handleAction('message')}
                    onLike={() => handleAction('like')}
                    isLiked={hasLiked}
                />
            </div>
        </footer>
      </div>

      <ImageCarouselDialog 
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        images={allPhotos}
        startIndex={selectedImageIndex}
      />
    </>
  );
}


export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <UserProfilePageContent />
    </Suspense>
  )
}

    