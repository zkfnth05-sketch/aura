'use server';
/**
 * @fileOverview AI-powered daily dating balance game generation flow.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

export const DailyBalanceGameInputSchema = z.object({
  date: z.string().describe('The date string YYYY-MM-DD to generate the question for.'),
});
export type DailyBalanceGameInput = z.infer<typeof DailyBalanceGameInputSchema>;

export const DailyBalanceGameOutputSchema = z.object({
  id: z.string().describe('Unique ID for the question, e.g. balance-YYYY-MM-DD.'),
  date: z.string().describe('The date string YYYY-MM-DD.'),
  category: z.string().describe('Category of the balance game, e.g. 데이트, 연락/썸, 연애관, 라이프스타일.'),
  question: z.string().describe('The intriguing Korean 2030 dating balance game question.'),
  optionA: z.object({
    text: z.string().describe('First option text (concise, appealing).'),
    emoji: z.string().describe('A single emoji representing option A.'),
    initialVotesPercent: z.number().describe('Simulated community consensus percentage between 40 and 60.'),
  }),
  optionB: z.object({
    text: z.string().describe('Second option text (equally appealing opposite).'),
    emoji: z.string().describe('A single emoji representing option B.'),
    initialVotesPercent: z.number().describe('Complement of initialVotesPercent (100 - A).'),
  }),
  tag: z.string().describe('Hashtag for the topic, e.g. #데이트코스.'),
  discussionPrompt: z.string().describe('A short sentence prompting members to share their reason in the comments.'),
});
export type DailyBalanceGameOutput = z.infer<typeof DailyBalanceGameOutputSchema>;

// Pre-curated high-engagement backup questions for fallback
const CURATED_BALANCE_GAMES: DailyBalanceGameOutput[] = [
  {
    id: 'curated-1',
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
  },
  {
    id: 'curated-2',
    date: 'today',
    category: '연락/썸',
    question: '연인 사이 연락 스타일, 더 선호하는 쪽은?',
    optionA: {
      text: '사소한 일상도 틈날 때마다 공유하는 칼답 💬',
      emoji: '💬',
      initialVotesPercent: 51,
    },
    optionB: {
      text: '각자 할 일 집중하고 퇴근 후 여유로운 통화 📞',
      emoji: '📞',
      initialVotesPercent: 49,
    },
    tag: '#연락스타일',
    discussionPrompt: '연락 빈도가 연애에 얼마나 중요하다고 생각하시나요?',
  },
  {
    id: 'curated-3',
    date: 'today',
    category: '연애관',
    question: '연인의 남사친 / 여사친 어디까지 이해 가능한가요?',
    optionA: {
      text: '오래된 친구라면 단둘이 낮에 커피 한잔 OK ☕',
      emoji: '☕',
      initialVotesPercent: 44,
    },
    optionB: {
      text: '단둘이 만나는 건 어떤 이유로도 절대 NO ❌',
      emoji: '❌',
      initialVotesPercent: 56,
    },
    tag: '#이성친구논쟁',
    discussionPrompt: '여러분의 단둘이 만남 허용 기준은 어디까지인가요?',
  },
  {
    id: 'curated-4',
    date: 'today',
    category: '라이프스타일',
    question: '주말 데이트, 더 설레는 힐링 코스는?',
    optionA: {
      text: '핫플 브런치 & 전시회 보며 사진 남기기 🎨',
      emoji: '🎨',
      initialVotesPercent: 53,
    },
    optionB: {
      text: '편한 옷 입고 집이나 룸카페에서 넷플릭스 정주행 🎬',
      emoji: '🎬',
      initialVotesPercent: 47,
    },
    tag: '#주말데이트',
    discussionPrompt: '이번 주말, 둘 중 하나만 할 수 있다면?',
  },
  {
    id: 'curated-5',
    date: 'today',
    category: '소개팅/첫인상',
    question: '소개팅 첫 만남, 대화 중 더 매력적인 순간은?',
    optionA: {
      text: '내 이야기에 눈 마주치며 깊게 공감해 줄 때 🥰',
      emoji: '🥰',
      initialVotesPercent: 62,
    },
    optionB: {
      text: '센스 있는 티키타카로 빵 터지게 웃겨줄 때 😆',
      emoji: '😆',
      initialVotesPercent: 38,
    },
    tag: '#첫인상매력',
    discussionPrompt: '어떤 이성에게 마음의 문이 더 빨리 열리나요?',
  }
];

export async function generateDailyBalanceGame(
  input?: DailyBalanceGameInput
): Promise<DailyBalanceGameOutput> {
  const today = input?.date || new Date().toISOString().split('T')[0];

  try {
    const prompt = `당신은 2030 프리미엄 소셜 데이팅 앱 AURA의 수석 연애 큐레이터 AI입니다.
오늘 날짜(${today})를 위한 기발하고, 과몰입을 부르며, 남녀 간에 건강한 토론이 터져 나올 만한 한국 2030 남녀 "연애 밸런스 게임" 질문 1개를 생성하세요.

[요구사항]
- 깻잎 논쟁처럼 한쪽에 쏠리지 않고 50:50에 가깝게 의견이 팽팽하게 갈리는 질문이어야 합니다.
- 2030 여성들이 흥미를 느끼고 친구나 이성에게 "너는 A야 B야?" 하고 바로 물어보고 싶어지는 주제여야 합니다.
- 한국어로 작성하세요.
- id는 "balance-${today}" 형식으로 지정하세요.
- initialVotesPercent는 40~60 사이의 현실적인 숫자로 설정하세요. (A + B = 100)`;

    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt,
      output: { schema: DailyBalanceGameOutputSchema },
    });

    if (output && output.question && output.optionA && output.optionB) {
      return {
        ...output,
        id: `balance-${today}`,
        date: today,
      };
    }
  } catch (error) {
    console.warn('Gemini daily balance game generation fallback to curated pool:', error);
  }

  // Graceful fallback deterministically based on date string
  const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallback = CURATED_BALANCE_GAMES[hash % CURATED_BALANCE_GAMES.length];

  return {
    ...fallback,
    id: `balance-${today}`,
    date: today,
  };
}
