'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, MessageCircle, Sparkles, ShieldCheck, ArrowRight, UserCheck, Flame, ChevronRight } from 'lucide-react';
import type { User } from '@/lib/types';
import { fetchGuestPreviewProfiles, CURATED_GUEST_FEMALE_PROFILES } from '@/lib/guest-preview-users';
import { GuestLikeSuccessModal } from '@/components/guest-like-success-modal';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

export default function GuestPreviewExperience() {
  const router = useRouter();
  const { t } = useLanguage();

  const [targetGender, setTargetGender] = useState<'여성' | '남성'>('여성');
  const [cards, setCards] = useState<User[]>(() => CURATED_GUEST_FEMALE_PROFILES || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Success modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedTargetUser, setSelectedTargetUser] = useState<User | null>(null);
  const [modalActionType, setModalActionType] = useState<'like' | 'message' | 'complete'>('like');

  // Initial gender picker dialog (first visit)
  const [showInitialPicker, setShowInitialPicker] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGender = localStorage.getItem('aura_guest_target_gender') as '여성' | '남성' | null;
      if (savedGender) {
        setTargetGender(savedGender);
      } else {
        setShowInitialPicker(true);
      }
    }
  }, []);

  const loadProfiles = useCallback(async (gender: '여성' | '남성') => {
    setIsLoadingCards(true);
    try {
      const result = await fetchGuestPreviewProfiles(gender);
      if (result && Array.isArray(result) && result.length > 0) {
        setCards(result);
      }
      setCurrentIndex(0);
    } catch (e) {
      console.error('Failed to load guest profiles:', e);
    } finally {
      setIsLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles(targetGender);
  }, [targetGender, loadProfiles]);

  const handleGenderSwitch = (gender: '여성' | '남성') => {
    setTargetGender(gender);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_guest_target_gender', gender);
    }
    setShowInitialPicker(false);
    loadProfiles(gender);
  };

  const activeUser = cards && cards.length > currentIndex ? cards[currentIndex] : null;

  const handleAction = (action: 'like' | 'dislike' | 'message') => {
    if (!activeUser || swipeState) return;

    const targetUser = activeUser;

    if (action === 'like' || action === 'message') {
      setSelectedTargetUser(targetUser);
      setModalActionType(action);
      setIsSuccessModalOpen(true);
      return;
    }

    // Dislike / Pass
    setSwipeState('left');
    setTimeout(() => {
      const nextIdx = currentIndex + 1;
      if (nextIdx >= cards.length) {
        // Swiped all 3 cards -> Trigger conversion modal with last user
        setSelectedTargetUser(targetUser);
        setModalActionType('complete');
        setIsSuccessModalOpen(true);
      } else {
        setCurrentIndex(nextIdx);
      }
      setSwipeState(null);
    }, 350);
  };

  const handleResetStack = () => {
    setCurrentIndex(0);
  };

  // Dragging physics for card
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const SWIPE_THRESHOLD = 90;

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - startPosRef.current.x;
    const dy = clientY - startPosRef.current.y;
    setDragPosition({ x: dx, y: dy });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragPosition.x) > SWIPE_THRESHOLD) {
      if (dragPosition.x > 0) {
        // Swiped Right -> LIKE
        setDragPosition({ x: 0, y: 0 });
        handleAction('like');
      } else {
        // Swiped Left -> PASS
        setDragPosition({ x: 0, y: 0 });
        handleAction('dislike');
      }
    } else {
      setDragPosition({ x: 0, y: 0 });
    }
  };

  const visibleCards = useMemo(() => {
    return cards.slice(currentIndex, currentIndex + 2).reverse();
  }, [cards, currentIndex]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Nav Bar */}
      <header className="relative z-20 w-full max-w-md mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-headline text-2xl font-extrabold bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#B3791B] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(229,169,52,0.4)]">
            AURA
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold tracking-wide flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>VIP 체험존</span>
          </span>
        </div>

        {/* Gender Toggle Chip */}
        <div className="flex items-center p-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
          <button
            onClick={() => handleGenderSwitch('여성')}
            className={cn(
              'px-2.5 py-1 rounded-full font-bold transition-all text-xs',
              targetGender === '여성'
                ? 'bg-gradient-to-r from-[#E5A934] to-[#C98718] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            👩 여성
          </button>
          <button
            onClick={() => handleGenderSwitch('남성')}
            className={cn(
              'px-2.5 py-1 rounded-full font-bold transition-all text-xs',
              targetGender === '남성'
                ? 'bg-gradient-to-r from-[#E5A934] to-[#C98718] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            👨 남성
          </button>
        </div>

        {/* Direct Login Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/signup')}
          className="text-xs text-zinc-400 hover:text-white px-2 h-7"
        >
          <span>로그인</span>
        </Button>
      </header>

      {/* Sub-header Value Banner */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-1 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-300 font-medium">50:50 성비 보장 실시간 추천</span>
        </div>
        <span className="text-amber-400 font-bold">
          {currentIndex < cards.length ? `${currentIndex + 1} / ${cards.length}` : '3 / 3'}
        </span>
      </div>

      {/* Main Card Swiping Deck */}
      <main className="relative flex-1 w-full max-w-md mx-auto px-4 pt-1 pb-4 flex flex-col items-center justify-center">
        <div className="relative w-full aspect-[3/4.4] max-w-[380px] perspective-1000">
          {visibleCards.length > 0 && activeUser ? (
            visibleCards.map((user, index) => {
              const isTop = index === 1 || visibleCards.length === 1;
              const rotation = isTop ? dragPosition.x / 18 : 0;
              const depth = isTop ? 0 : 1;

              let transform = `translateY(${depth * 10}px) scale(${1 - depth * 0.05})`;
              if (isTop) {
                if (swipeState) {
                  transform = `translateX(${swipeState === 'left' ? '-140%' : '140%'}) rotate(${
                    swipeState === 'left' ? -20 : 20
                  }deg) ${transform}`;
                } else {
                  transform = `translateX(${dragPosition.x}px) translateY(${dragPosition.y}px) rotate(${rotation}deg) ${transform}`;
                }
              }

              const photoUrl = user.photoUrls?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';

              return (
                <div
                  key={user.id}
                  className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-800"
                  style={{
                    transform,
                    zIndex: isTop ? 40 : 20,
                    opacity: isTop ? 1 : 0.65,
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                  onMouseDown={(e) => isTop && handleDragStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => isTop && handleDragMove(e.clientX, e.clientY)}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={(e) => isTop && handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchMove={(e) => isTop && handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchEnd={handleDragEnd}
                >
                  {/* Photo with gradient overlay */}
                  <div className="relative w-full h-full bg-zinc-950">
                    <Image
                      src={photoUrl}
                      alt={user.name}
                      fill
                      className="object-cover pointer-events-none"
                      priority={isTop}
                      sizes="(max-width: 450px) 100vw, 380px"
                    />

                    {/* Drag Stamp Visual Indicators */}
                    {isTop && dragPosition.x > 35 && (
                      <div className="absolute top-6 left-6 border-4 border-emerald-400 bg-emerald-500/20 px-4 py-1.5 rounded-2xl rotate-[-15deg] shadow-lg">
                        <span className="text-xl font-extrabold text-emerald-300 tracking-wider">LIKE 💖</span>
                      </div>
                    )}
                    {isTop && dragPosition.x < -35 && (
                      <div className="absolute top-6 right-6 border-4 border-rose-500 bg-rose-500/20 px-4 py-1.5 rounded-2xl rotate-[15deg] shadow-lg">
                        <span className="text-xl font-extrabold text-rose-300 tracking-wider">PASS ❌</span>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-extrabold shadow-md">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>AURA 매력도 98점</span>
                      </div>

                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[11px] font-bold">
                        <UserCheck className="w-3 h-3" />
                        <span>100% 실명 인증</span>
                      </div>
                    </div>

                    {/* Bottom Profile Info Card */}
                    <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black via-black/70 to-transparent pt-20 flex flex-col justify-end text-white text-left z-10">
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                          {user.name}
                        </h2>
                        <span className="text-xl font-light text-zinc-300">{user.age}세</span>
                        <span className="text-xs text-zinc-400 ml-1">· {user.location?.replace('서울특별시 ', '').replace('경기 ', '')}</span>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-200 mt-1.5 line-clamp-2 leading-relaxed">
                        {user.bio}
                      </p>

                      {/* Tag Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold text-white">
                          #자연스러운_만남
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-[11px] font-semibold text-amber-300">
                          #취향_데이트
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold text-zinc-200">
                          #매칭율 99%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State after completing 3 cards */
            <div className="absolute inset-0 rounded-3xl bg-zinc-950 border border-amber-500/30 p-6 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 animate-bounce">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white">
                추천 이상형 3명을 모두 확인하셨습니다!
              </h3>
              <p className="text-xs text-zinc-400 mt-2 mb-6 leading-relaxed">
                지금 3초 만에 시작하고 마음에 드는 이성에게 호감을 보내보세요.
              </p>
              <Button
                onClick={() => router.push('/signup')}
                className="w-full h-12 rounded-full bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-extrabold text-sm shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>✨ 지금 1초 만에 무료 시작하기</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <button
                onClick={handleResetStack}
                className="mt-4 text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                다시 처음부터 둘러보기
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Bar */}
        {activeUser && (
          <div className="flex items-center justify-center gap-6 mt-5 z-20">
            {/* Pass Button */}
            <button
              onClick={() => handleAction('dislike')}
              className="w-14 h-14 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 flex items-center justify-center shadow-lg active:scale-90 transition-all"
              title="넘기기"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 1:1 Message Button */}
            <button
              onClick={() => handleAction('message')}
              className="w-12 h-12 rounded-full bg-zinc-900/90 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 flex items-center justify-center shadow-lg active:scale-90 transition-all"
              title="1:1 대화 신청"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
            </button>

            {/* Like Heart Button (Main CTA) */}
            <button
              onClick={() => handleAction('like')}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#E5A934] via-[#DE9F2B] to-[#C7871E] text-black hover:brightness-110 flex items-center justify-center shadow-[0_4px_24px_rgba(229,169,52,0.45)] active:scale-90 transition-all"
              title="호감 보내기"
            >
              <Heart className="w-7 h-7 fill-current text-black" />
            </button>
          </div>
        )}
      </main>

      {/* Bottom Sticky Direct CTA Banner */}
      <footer className="relative z-20 w-full max-w-md mx-auto px-4 pb-5 pt-1">
        <button
          onClick={() => router.push('/signup')}
          className="w-full py-3 px-4 rounded-2xl bg-zinc-900/90 border border-amber-500/40 hover:border-amber-400/80 flex items-center justify-between shadow-xl transition-all group"
        >
          <div className="flex items-center gap-2.5 text-left">
            <span className="text-lg">💖</span>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                내 이상형과 실시간 매칭 시작하기
              </p>
              <p className="text-[10px] text-zinc-400">
                남녀 50:50 성비 보장 · 3초 간편 시작
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs">
            <span>시작하기</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </footer>

      {/* Initial 0.1s Gender Selection Dialog */}
      {showInitialPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-amber-500/40 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">
                어떤 분을 만나보고 싶으신가요?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                회원님에게 어울리는 실시간 추천 카드를 준비해 드립니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                onClick={() => handleGenderSwitch('여성')}
                className="h-14 rounded-2xl bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-extrabold text-sm shadow-lg hover:brightness-110 flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-base">👩 여성 회원</span>
                <span className="text-[10px] opacity-80 font-normal">여성 프로필 보기</span>
              </Button>
              <Button
                onClick={() => handleGenderSwitch('남성')}
                className="h-14 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-amber-500/60 text-white font-extrabold text-sm shadow-lg flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-base">👨 남성 회원</span>
                <span className="text-[10px] text-zinc-400 font-normal">남성 프로필 보기</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Conversion Modal */}
      <GuestLikeSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        targetUser={selectedTargetUser}
        onResetStack={handleResetStack}
        actionType={modalActionType}
      />
    </div>
  );
}
