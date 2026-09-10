'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/layout/header';
import { LoungeComposer } from '@/components/lounge/lounge-composer';
import { LoungePostCard } from '@/components/lounge/lounge-post-card';
import { LoungeBalanceGame } from '@/components/lounge/lounge-balance-game';
import { LoungeStore } from '@/lib/lounge-store';
import { LoungePost, LoungeCategory } from '@/lib/lounge-types';
import { Sparkles, Flame, Coffee, Dumbbell, Dog, MessageSquare, Compass, Palette, RefreshCw, PenSquare, VenetianMask as Mask } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategoryTab {
  id: LoungeCategory;
  label: string;
  icon?: React.ReactNode;
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'all', label: '전체' },
  { id: 'anonymous', label: '익명고민', icon: <Mask className="w-3.5 h-3.5 text-purple-400" /> },
  { id: 'popular', label: '인기', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
  { id: 'cafe', label: '카페·맛집', icon: <Coffee className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'fitness', label: '오운완', icon: <Dumbbell className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: 'pet', label: '반려견', icon: <Dog className="w-3.5 h-3.5 text-yellow-400" /> },
  { id: 'daily', label: '일상', icon: <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> },
  { id: 'travel', label: '여행', icon: <Compass className="w-3.5 h-3.5 text-sky-400" /> },
  { id: 'culture', label: '문화·전시', icon: <Palette className="w-3.5 h-3.5 text-purple-400" /> },
];

const ROLLING_NOTICES = [
  { icon: '🛡️', text: '100% 프로필 검증을 마친 프라이빗 공간' },
  { icon: '🔒', text: '안심하고 속마음을 털어놓는 시크릿 라운지' },
  { icon: '✨', text: '상호 매너를 지키는 프리미엄 멤버스' },
];

export default function LoungePage() {
  const [posts, setPosts] = useState<LoungePost[]>([]);
  const [activeCategory, setActiveCategory] = useState<LoungeCategory>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [fadeAnim, setFadeAnim] = useState(true);

  // Ticker for rolling notices
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeAnim(false);
      setTimeout(() => {
        setNoticeIndex((prev) => (prev + 1) % ROLLING_NOTICES.length);
        setFadeAnim(true);
      }, 250);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const loadPosts = useCallback(async () => {
    const loaded = LoungeStore.getPosts();
    setPosts(loaded);

    // Sync with database virtual members
    const synced = await LoungeStore.syncWithRealMembers();
    setPosts(synced);
  }, []);

  useEffect(() => {
    loadPosts();

    // Listen to cross-component store updates
    const handleStorageChange = () => {
      loadPosts();
    };

    window.addEventListener('aura_lounge_updated', handleStorageChange);
    return () => {
      window.removeEventListener('aura_lounge_updated', handleStorageChange);
    };
  }, [loadPosts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    if (activeCategory === 'all') {
      return posts;
    }

    if (activeCategory === 'popular') {
      // Sort by likes descending or filter posts with at least 5 likes
      return [...posts].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    if (activeCategory === 'anonymous') {
      return posts.filter(
        (post) =>
          post.isAnonymous ||
          post.tags?.some((t) => t.includes('익명') || t.includes('고민')) ||
          post.content.includes('고민') ||
          post.content.includes('속마음')
      );
    }

    // Filter by tag keyword mapping
    const tagKeywords: Record<string, string[]> = {
      cafe: ['카페', '맛집', '디저트', '커피'],
      fitness: ['오운완', '운동', '러닝', '헬스', '필라테스'],
      pet: ['반려견', '댕댕이', '강아지', '고양이', '반려묘'],
      daily: ['일상', '퇴근', '소소한', '생각', '오늘의무드'],
      travel: ['여행', '바다', '드라이브', '휴가', '호캉스'],
      culture: ['문화', '전시', '미술관', '음악', '영화'],
    };

    const keywords = tagKeywords[activeCategory] || [];

    return posts.filter((post) => {
      const matchTag = post.tags?.some((t) => keywords.some((k) => t.includes(k)));
      const matchContent = keywords.some((k) => post.content.includes(k));
      return matchTag || matchContent;
    });
  }, [posts, activeCategory]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* App Top Header */}
      <Header />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-28">
        {/* Lounge Premium Header Banner */}
        <section className="mb-5 rounded-3xl p-5 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-amber-500/30 shadow-[0_8px_30px_rgba(229,169,52,0.1)] relative overflow-hidden text-left">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AURA Lounge</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/80"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </Button>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] bg-clip-text text-transparent">
            AURA 라운지
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
            회원들의 소소한 일상과 취향을 나누는 프라이빗 공간
          </p>

          <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 overflow-hidden h-5 min-w-0 pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <div
                className={`flex items-center gap-1.5 transition-all duration-300 transform whitespace-nowrap ${
                  fadeAnim ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1.5'
                }`}
              >
                <span className="text-xs">{ROLLING_NOTICES[noticeIndex].icon}</span>
                <span className="text-zinc-300 font-medium truncate">
                  {ROLLING_NOTICES[noticeIndex].text}
                </span>
              </div>
            </div>
            <span className="text-amber-400/90 font-medium flex-shrink-0">✨ 아바타 클릭 시 1:1 대화</span>
          </div>
        </section>

        {/* Category Filter Chips (2-Row Wrap Layout) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#E5A934] to-[#C98718] text-black shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Daily Romance Balance Game (Gemini AI generated) */}
        <LoungeBalanceGame />

        {/* Post Creation Box */}
        <LoungeComposer onPostCreated={loadPosts} />

        {/* Posts Feed */}
        <section aria-label="Lounge Feed" className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <LoungePostCard
                key={post.id}
                post={post}
                onUpdated={loadPosts}
              />
            ))
          ) : (
            <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/60 mt-4">
              <Sparkles className="w-8 h-8 text-amber-400/60 mx-auto mb-2.5 animate-bounce" />
              <p className="text-sm font-bold text-zinc-300 mb-1">
                아직 이 카테고리에 글이 없어요
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                가장 먼저 소소한 일상이나 사진을 공유해보세요!
              </p>
              <Button
                size="sm"
                onClick={() => setActiveCategory('all')}
                className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold"
              >
                전체 피드 보기
              </Button>
            </div>
          )}
        </section>

        {/* Floating Write Button */}
        <button
          onClick={() => {
            const el = document.getElementById('lounge-composer');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const textarea = el.querySelector('textarea');
              if (textarea) textarea.focus();
            }
          }}
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#E5A934] to-[#C98718] hover:from-[#F0B746] hover:to-[#D49425] text-black font-extrabold text-xs shadow-xl shadow-amber-500/30 active:scale-95 transition-all"
        >
          <PenSquare className="w-4 h-4 text-black" />
          <span>글쓰기</span>
        </button>
      </main>
    </div>
  );
}
