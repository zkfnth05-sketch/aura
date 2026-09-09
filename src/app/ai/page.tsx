
'use client';

import { useState, useEffect, useCallback } from 'react';
import AiPageClient from '@/components/ai-page-client';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { fromSupabaseUser } from '@/lib/supabaseMappers';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DateCourseForm from '@/components/date-course-form';
import AuraCharmReportDialog from '@/components/aura-charm-report-dialog';
import type { AuraCharmOutput } from '@/actions/ai-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { calculateCompatibility } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import CoachMarkGuide from '@/components/coach-mark-guide';
import { aiGuide } from '@/lib/coachmark-steps';


const UserGridSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="w-full aspect-[3/4] rounded-lg" />
        ))}
    </div>
);

const FETCH_POOL_SIZE = 50; // Fetch a pool of users to find the best 6
const DISPLAY_COUNT = 6;

export default function AiPage() {
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuraDialogOpen, setIsAuraDialogOpen] = useState(false);
  const [savedAuraReport, setSavedAuraReport] = useState<AuraCharmOutput | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (currentUser?.id) {
      try {
        const cached = localStorage.getItem(`aura_charm_report_${currentUser.id}`);
        if (cached) {
          setSavedAuraReport(JSON.parse(cached));
        }
      } catch (_) {}
    }
  }, [currentUser?.id]);

  const loadRecommendations = useCallback(async () => {
      if (!currentUser) {
        if (!isUserLoaded) return;
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const isMale = currentUser.gender === '남성' || currentUser.gender?.toLowerCase().startsWith('m');
        const oppositeGender = isMale ? '여성' : '남성';
        
        let pool: User[] = [];
        if (supabase) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('gender', oppositeGender)
            .neq('id', currentUser.id)
            .limit(FETCH_POOL_SIZE);
          if (!error && data) {
            pool = data.map(fromSupabaseUser);
          }
        }
        
        const filteredAndScoredUsers = pool
            .filter(user => {
                if (user.gender !== oppositeGender) return false;
                if (user.id === currentUser.id) return false;
                if (!user.photoUrls || user.photoUrls.length === 0) return false;
                if (currentUser.blockedUsers?.includes(user.id)) return false;
                if (user.blockedUsers?.includes(currentUser.id)) return false;
                return true;
            })
            .map(user => ({
                user,
                compatibility: calculateCompatibility(currentUser, user)
            }));
            
        // Sort by compatibility score
        filteredAndScoredUsers.sort((a, b) => b.compatibility.score - a.compatibility.score);

        setRecommendedUsers(filteredAndScoredUsers.slice(0, DISPLAY_COUNT).map(item => item.user));

      } catch (error) {
        console.error("Error fetching recommended users:", error);
        setRecommendedUsers([]);
      } finally {
        setIsLoading(false);
      }
  }, [currentUser, isUserLoaded]);

  useEffect(() => {
    if (isUserLoaded) {
      loadRecommendations();
    }
  }, [isUserLoaded, loadRecommendations]);
  
  const handleRefresh = () => {
    loadRecommendations();
  }

  if (!isUserLoaded || !currentUser) {
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <CoachMarkGuide guide={aiGuide} />
      <Header />
      <main className="container pt-8">
        <Tabs defaultValue="ideal-type" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 border-b border-border/40 rounded-none text-xs">
            <TabsTrigger
              value="ideal-type"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground"
            >
              {t('ai_rec_ideal_type_tab')}
            </TabsTrigger>
            <TabsTrigger
              value="date-course"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground"
            >
              {t('ai_rec_date_course_tab')}
            </TabsTrigger>
            <TabsTrigger
              value="aura-report"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-400 bg-transparent text-muted-foreground"
            >
              ✨ 나의 아우라
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ideal-type" className="mt-6 pb-8">
            {isLoading ? (
               <UserGridSkeleton />
            ) : (
                <>
                    <AiPageClient recommendedUsers={recommendedUsers} currentUser={currentUser} />
                    <Button onClick={handleRefresh} className="w-full mt-6">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('show_new_recommendations_button')}
                    </Button>
                </>
            )}
            { !isLoading && recommendedUsers.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">{t('no_ai_recommendations')}</p>
                </div>
            )}
          </TabsContent>
          <TabsContent value="date-course" className="mt-6 pb-8">
            <DateCourseForm />
          </TabsContent>
          <TabsContent value="aura-report" className="mt-6 pb-8">
            <div className="max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-b from-purple-950/40 via-zinc-900 to-black border border-pink-500/40 shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">제미나이 AI 나의 아우라 매력 진단</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  내 사진과 프로필을 제미나이 비전 AI가 분석하여 인스타 스토리에 공유할 수 있는 1장짜리 프리미엄 화보 카드로 만들어 드립니다.
                </p>
              </div>

              {savedAuraReport ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                    <span>👑 아우라 지수: {savedAuraReport.auraScore}점</span>
                    <span className="text-pink-400">상위 {savedAuraReport.percentile}%</span>
                  </div>
                  <h3 className="text-base font-bold text-white">[ {savedAuraReport.title} ]</h3>
                  <p className="text-xs text-zinc-300 line-clamp-2">{savedAuraReport.analysis}</p>
                </div>
              ) : null}

              <Button
                type="button"
                onClick={() => setIsAuraDialogOpen(true)}
                className="w-full py-6 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:opacity-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>
                  {savedAuraReport
                    ? '📸 인스타 화보 카드 열기 & 공유하기'
                    : '🔮 3초 만에 나의 매력 진단받기'}
                </span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {currentUser && (
          <AuraCharmReportDialog
            open={isAuraDialogOpen}
            onOpenChange={setIsAuraDialogOpen}
            user={currentUser}
            initialReport={savedAuraReport}
            onReportSaved={setSavedAuraReport}
          />
        )}
      </main>
    </div>
  );
}
