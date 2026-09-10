'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DailyBalanceGameOutput } from '@/ai/flows/daily-balance-game-flow';
import { getDailyBalanceGameAction } from '@/actions/ai-actions';
import { Sparkles, Check, Flame, MessageSquareHeart, RefreshCw, ChevronRight, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MatchingMember {
  id: string;
  name: string;
  age: number;
  gender: string;
  avatar: string;
  location: string;
}

// Real virtual members directly from Supabase Database
const CHOICE_A_MEMBERS: MatchingMember[] = [
  {
    id: '96RQydIg34IX1DPxoDWv',
    name: '반짝반짝',
    age: 29,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/96RQydIg34IX1DPxoDWv_0_1788952692614.jpg',
  },
  {
    id: 'EOq5OEHehqt7bSfq8IlF',
    name: '달빛조각사',
    age: 25,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/EOq5OEHehqt7bSfq8IlF_0_1788952694630.jpg',
  },
  {
    id: '7Cmrx37z7e6wkoxtMCxZ',
    name: '숲속의낮잠',
    age: 25,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/7Cmrx37z7e6wkoxtMCxZ_0_1788952692005.jpg',
  },
  {
    id: 'HnmxsGg591Re3oE1MbcX',
    name: '보랏빛노을',
    age: 29,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/HnmxsGg591Re3oE1MbcX_0_1788952701222.jpg',
  },
  {
    id: 'TDfGdzl0FLedu3eLqsHh',
    name: '하얀목화솜',
    age: 31,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/TDfGdzl0FLedu3eLqsHh_0_1788952700703.jpg',
  },
  {
    id: 'YoP94iadjL8FyMhtifTE',
    name: 'Hana',
    age: 25,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/YoP94iadjL8FyMhtifTE_0_1788952703103.jpg',
  },
  {
    id: 'dC4qedMP9D8LiybNHQYt',
    name: '선영',
    age: 28,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/dC4qedMP9D8LiybNHQYt_0_1788952705267.jpg',
  },
  {
    id: '2EmGh8y6NJx8GIEAkzmH',
    name: '쪼꼬우유',
    age: 28,
    gender: '여성',
    location: '대구',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/2EmGh8y6NJx8GIEAkzmH_0_1788952707871.jpg',
  },
  {
    id: '50dJcA4Jq6z8xqCwNCls',
    name: '옆집소녀',
    age: 27,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/50dJcA4Jq6z8xqCwNCls_0_1788952709702.jpg',
  },
  {
    id: '5h7ZgWAZgR99AYQWXLJI',
    name: '은하수여행자',
    age: 29,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/5h7ZgWAZgR99AYQWXLJI_0_1788952710573.jpg',
  },
  {
    id: 'IZGZp2KPihOre5qb3I9I',
    name: '카이',
    age: 35,
    gender: '남성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/IZGZp2KPihOre5qb3I9I_0_1788952701591.jpg',
  },
  {
    id: '6YNODSsfTT8FGlirDhaN',
    name: '시우',
    age: 28,
    gender: '남성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/6YNODSsfTT8FGlirDhaN_0_1788952691593.jpg',
  },
];

const CHOICE_B_MEMBERS: MatchingMember[] = [
  {
    id: 'AAOZg1Jz2zLDosPyWBLE',
    name: '지현',
    age: 25,
    gender: '여성',
    location: '대전',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/AAOZg1Jz2zLDosPyWBLE_0_1788952693292.jpg',
  },
  {
    id: 'B71kPkcFSeKUB25oWXtO',
    name: '민트향기',
    age: 30,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/B71kPkcFSeKUB25oWXtO_0_1788952693842.jpg',
  },
  {
    id: 'F9nWVXenSObnh23nmsGa',
    name: 'Chloe',
    age: 19,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/F9nWVXenSObnh23nmsGa_0_1788952696212.jpg',
  },
  {
    id: 'GFqa5nHSmgm7laf1fiD1',
    name: '가을바람휘잉',
    age: 30,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/GFqa5nHSmgm7laf1fiD1_0_1788952696582.jpg',
  },
  {
    id: 'YZlwrZAQoOZ1SAl1VVIM',
    name: '수아',
    age: 34,
    gender: '여성',
    location: '제주',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/YZlwrZAQoOZ1SAl1VVIM_0_1788952702725.jpg',
  },
  {
    id: '9ibvRn6nrthW350dCEh6',
    name: '동네친구',
    age: 27,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/9ibvRn6nrthW350dCEh6_0_1788952692912.jpg',
  },
  {
    id: 'X1XhN4EB34KWBKHg0euU',
    name: 'Seri',
    age: 33,
    gender: '여성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/X1XhN4EB34KWBKHg0euU_0_1788952702342.jpg',
  },
  {
    id: '7SkCjrdeQvf0L9EDm6A1',
    name: 'Neo',
    age: 35,
    gender: '남성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/7SkCjrdeQvf0L9EDm6A1_0_1788952692294.jpg',
  },
  {
    id: 'Eu6ddvE608fuL2irbRPa',
    name: '에이스',
    age: 25,
    gender: '남성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/Eu6ddvE608fuL2irbRPa_0_1788952695836.jpg',
  },
  {
    id: 'SGQtnYq1TpCv77REwTh0',
    name: '프라임',
    age: 28,
    gender: '남성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/SGQtnYq1TpCv77REwTh0_0_1788952699116.jpg',
  },
  {
    id: 'dHbWQVtSntPRaNmeyPD3',
    name: '어반맨',
    age: 35,
    gender: '남성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/dHbWQVtSntPRaNmeyPD3_0_1788952705651.jpg',
  },
  {
    id: 'V2lsQsmOVoacEUFivONC',
    name: '딥블루',
    age: 27,
    gender: '남성',
    location: '서울',
    avatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/V2lsQsmOVoacEUFivONC_0_1788952703642.jpg',
  },
];

const DEFAULT_INITIAL_GAME: DailyBalanceGameOutput = {
  id: 'balance-default',
  date: 'today',
  category: '데이트',
  question: '첫 데이트 코스로 더 호감 가는 분위기는?',
  optionA: {
    text: '성수동 조용하고 감성 가득한 와인바 🍷',
    emoji: '🍷',
    initialVotesPercent: 58,
  },
  optionB: {
    text: '탁 트인 한강 야경 보며 치맥 & 산책 🍗',
    emoji: '🍗',
    initialVotesPercent: 42,
  },
  tag: '#첫데이트',
  discussionPrompt: '여러분의 첫 데이트 로망은 어느 쪽인가요?',
};

export function LoungeBalanceGame() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [game, setGame] = useState<DailyBalanceGameOutput>(DEFAULT_INITIAL_GAME);
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);
  const [dbMembersA, setDbMembersA] = useState<MatchingMember[]>(CHOICE_A_MEMBERS);
  const [dbMembersB, setDbMembersB] = useState<MatchingMember[]>(CHOICE_B_MEMBERS);

  // Sync real members from Supabase database
  useEffect(() => {
    async function syncRealDbUsers() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, age, gender, location, photo_urls')
          .not('photo_urls', 'is', null)
          .limit(50);

        if (!error && data && data.length > 0) {
          const valid = data
            .filter(u => u.photo_urls && u.photo_urls.length > 0 && u.photo_urls[0].startsWith('http'))
            .map(u => ({
              id: u.id,
              name: u.name || '회원',
              age: u.age || 28,
              gender: u.gender || '여성',
              location: u.location || '서울',
              avatar: u.photo_urls[0],
            }));

          if (valid.length >= 6) {
            // If user is logged in, prioritize opposite gender first
            let sorted = valid;
            if (user?.gender === '남성') {
              sorted = [...valid.filter(u => u.gender === '여성'), ...valid.filter(u => u.gender === '남성')];
            } else if (user?.gender === '여성') {
              sorted = [...valid.filter(u => u.gender === '남성'), ...valid.filter(u => u.gender === '여성')];
            }

            const half = Math.ceil(sorted.length / 2);
            setDbMembersA(sorted.slice(0, half));
            setDbMembersB(sorted.slice(half));
          }
        }
      } catch (e) {
        console.warn('Failed to sync DB users for balance game:', e);
      }
    }
    syncRealDbUsers();
  }, [user?.gender]);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadGame = useCallback(async (forceNew = false) => {
    const cacheKey = `aura_balance_game_${todayStr}`;
    const voteKey = `aura_balance_vote_${todayStr}`;

    if (!forceNew) {
      try {
        const cached = localStorage.getItem(cacheKey);
        const savedVote = localStorage.getItem(voteKey) as 'A' | 'B' | null;
        if (cached) {
          setGame(JSON.parse(cached));
          if (savedVote) setSelectedChoice(savedVote);
          return;
        }
      } catch {}
    }

    try {
      setIsGeneratingNew(true);
      const generated = await getDailyBalanceGameAction(todayStr);
      if (generated && generated.question) {
        setGame(generated);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(generated));
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to load Gemini balance game:', err);
    } finally {
      setIsGeneratingNew(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const handleVote = (choice: 'A' | 'B') => {
    if (!game) return;
    setSelectedChoice(choice);
    try {
      localStorage.setItem(`aura_balance_vote_${todayStr}`, choice);
    } catch {}

    const chosenText = choice === 'A' ? game.optionA.text : game.optionB.text;
    toast({
      title: '🎯 투표 완료!',
      description: `[${chosenText}]에 투표하셨습니다. 나와 취향이 같은 회원을 확인해보세요!`,
    });
  };

  const handleConnectWithMember = async (member: MatchingMember) => {
    if (!user || !game) {
      router.push(`/users/${member.id}`);
      return;
    }

    const currentUserId = user.id;
    const targetUserId = member.id;
    const chosenText = selectedChoice === 'A' ? game.optionA.text : game.optionB.text;
    const iceBreakerMsg = `안녕하세요 ${member.name}님! 오늘 라운지 밸런스 게임에서 저도 [${chosenText}] 골랐는데, 취향 통하시네요! 😊`;

    const matchId = [currentUserId, targetUserId].sort().join('_');
    const now = new Date().toISOString();

    try {
      if (supabase) {
        await supabase.from('matches').upsert({
          id: matchId,
          users: [currentUserId, targetUserId],
          last_message: iceBreakerMsg,
          last_message_timestamp: now,
          last_message_sender_id: currentUserId,
          unread_counts: { [currentUserId]: 0, [targetUserId]: 1 },
          call_status: 'idle',
          caller_id: null,
          match_date: now,
        }, { onConflict: 'id' });

        await supabase.from('messages').insert({
          match_id: matchId,
          sender_id: currentUserId,
          content: `[오늘의 밸런스 픽: "${game.question}"]\n${iceBreakerMsg}`,
          created_at: now,
        });
      }
    } catch (err) {
      console.warn('Failed to insert match:', err);
    }

    toast({
      title: `💌 ${member.name}님께 취향 공감 메시지 전송!`,
      description: '대화창으로 이동합니다.',
    });

    setTimeout(() => {
      router.push(`/chat/${matchId}`);
    }, 400);
  };

  if (!game) {
    return null;
  }

  const percentA = selectedChoice === 'A' 
    ? Math.min(85, game.optionA.initialVotesPercent + 3)
    : selectedChoice === 'B' 
      ? Math.max(15, game.optionA.initialVotesPercent - 3)
      : game.optionA.initialVotesPercent;
  const percentB = 100 - percentA;

  const matchingMembers = selectedChoice === 'A' ? dbMembersA : dbMembersB;

  return (
    <section 
      aria-label="오늘의 연애 밸런스 게임"
      className="w-full bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(229,169,52,0.12)] backdrop-blur-xl relative overflow-hidden mb-5 text-left"
    >
      {/* Subtle gold decorative glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 flex-shrink-0">
            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
            오늘의 연애 밸런스
          </span>
          <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[130px] sm:max-w-none">
            {game.tag}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 font-medium">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            Gemini AI 출제
          </span>
          <button
            onClick={() => loadGame(true)}
            disabled={isGeneratingNew}
            title="새로운 질문 생성"
            className="p-1 rounded-full text-zinc-500 hover:text-amber-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingNew ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Question Headline */}
      <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug mb-3.5 break-words">
        Q. {game.question}
      </h2>

      {/* Choice Buttons A / B */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
        {/* Option A */}
        <button
          type="button"
          onClick={() => handleVote('A')}
          className={`relative p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] overflow-hidden ${
            selectedChoice === 'A'
              ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/20'
              : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-800/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-black text-amber-400 block mb-1">
                A.
              </span>
              <p className="text-xs sm:text-sm font-bold text-zinc-100 leading-snug">
                {game.optionA.text}
              </p>
            </div>
            {selectedChoice === 'A' && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
          </div>

          {/* Voting percentage bar */}
          {selectedChoice && (
            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between relative z-10">
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mr-2">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${percentA}%` }}
                />
              </div>
              <span className="text-xs font-black text-amber-400 min-w-[36px] text-right">
                {percentA}%
              </span>
            </div>
          )}
        </button>

        {/* Option B */}
        <button
          type="button"
          onClick={() => handleVote('B')}
          className={`relative p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] overflow-hidden ${
            selectedChoice === 'B'
              ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/20'
              : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-800/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-black text-amber-400 block mb-1">
                B.
              </span>
              <p className="text-xs sm:text-sm font-bold text-zinc-100 leading-snug">
                {game.optionB.text}
              </p>
            </div>
            {selectedChoice === 'B' && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
          </div>

          {/* Voting percentage bar */}
          {selectedChoice && (
            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between relative z-10">
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mr-2">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${percentB}%` }}
                />
              </div>
              <span className="text-xs font-black text-amber-400 min-w-[36px] text-right">
                {percentB}%
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Post-Vote: Matching Members Section */}
      {selectedChoice && (
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              나와 같은 선택을 한 추천 회원
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">
              취향 일치도 100%
            </span>
          </div>

          {/* Top 3 Members List */}
          <div className="flex flex-col gap-2">
            {matchingMembers.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/40 transition-all group"
              >
                <div 
                  onClick={() => router.push(`/users/${member.id}`)}
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 mr-2"
                >
                  <Avatar className="w-10 h-10 border border-amber-500/40 group-hover:scale-105 transition-transform flex-shrink-0">
                    <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                    <AvatarFallback className="text-xs bg-zinc-800 text-amber-300 font-bold">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300">
                        {member.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold flex-shrink-0">
                        {selectedChoice} 픽
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {member.age}세 · {member.location}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleConnectWithMember(member)}
                  className="h-8 px-3 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-extrabold flex items-center gap-1 flex-shrink-0 transition-all active:scale-95 shadow-sm"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5 text-amber-400" />
                  <span>대화하기</span>
                </Button>
              </div>
            ))}
          </div>

          {/* See More Button */}
          <button
            type="button"
            onClick={() => setIsMoreModalOpen(true)}
            className="w-full mt-2.5 py-2.5 px-4 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-xs font-bold text-zinc-300 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99]"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>+ 같은 선택을 한 {matchingMembers.length}명의 회원 더보기</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      )}

      {/* Full Matching Members Modal Dialog */}
      <Dialog open={isMoreModalOpen} onOpenChange={setIsMoreModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border border-amber-500/40 text-white rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-3 border-b border-zinc-800/80 text-left">
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>[{selectedChoice === 'A' ? game.optionA.text : game.optionB.text}] 선택 회원</span>
            </DialogTitle>
            <p className="text-xs text-zinc-400 mt-1">
              나와 같은 연애 가치관을 선택한 취향 일치도 100% 추천 회원들입니다.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
            {matchingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition-all group"
              >
                <div 
                  onClick={() => {
                    setIsMoreModalOpen(false);
                    router.push(`/users/${member.id}`);
                  }}
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 mr-2"
                >
                  <Avatar className="w-10 h-10 border border-amber-500/40 group-hover:scale-105 transition-transform flex-shrink-0">
                    <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                    <AvatarFallback className="text-xs bg-zinc-800 text-amber-300 font-bold">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300">
                        {member.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold flex-shrink-0">
                        {selectedChoice} 픽
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {member.age}세 · {member.location}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setIsMoreModalOpen(false);
                    handleConnectWithMember(member);
                  }}
                  className="h-8 px-3 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-extrabold flex items-center gap-1 flex-shrink-0 transition-all active:scale-95 shadow-sm"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5 text-amber-400" />
                  <span>대화하기</span>
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
