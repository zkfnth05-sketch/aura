'use server';

/**
 * @fileOverview AI flow to generate a personalized Aura Charm Diagnostic Report (나의 아우라 매력 진단 리포트)
 * Analyzes user profile, photo, and lifestyle to create an Instagram-worthy charm card.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const AuraCharmInputSchema = z.object({
  name: z.string(),
  gender: z.string(),
  age: z.number().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  hobbies: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  lifestyle: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
});
export type AuraCharmInput = z.infer<typeof AuraCharmInputSchema>;

const AuraCharmOutputSchema = z.object({
  auraScore: z.number().describe('매력 지수 (92 ~ 99점 사이의 정수)'),
  percentile: z.number().describe('상위 퍼센트 (1 ~ 5 사이의 정수)'),
  title: z.string().describe('트렌디하고 매력적인 퍼스널 캐릭터 타이틀 (예: 따뜻한 도시의 라떼남 ☕, 햇살 머금은 청순 아우라 🌸, 지적인 성수동 갤러리스트 🎨)'),
  auraColor: z.string().describe('시그니처 오라 컬러 이름 (예: 골드 앰버, 로즈 쿼츠, 네온 바이올렛, 샴페인 골드)'),
  keywords: z.array(z.string()).describe('인스타 감성의 매력 해시태그 3개 (예: #세련된_미소, #다정한_대화, #반려묘_감성)'),
  analysis: z.string().describe('사용자의 사진 분위기와 프로필을 극찬하며 세련된 매력을 짚어주는 2~3문장의 분석 코멘트'),
  bestMatchStyle: z.string().describe('나와 궁합 99%인 최고의 이성 스타일 한 줄 묘사 (예: 햇살처럼 밝고 리액션이 좋은 감성 전시회 메이트)'),
  dateRecommendation: z.string().describe('나의 매력이 가장 빛나는 추천 첫 데이트 코스 한 줄 (예: 조용한 한남동 앤틱 카페에서 나누는 스페셜티 커피 데이트)'),
});
export type AuraCharmOutput = z.infer<typeof AuraCharmOutputSchema>;

function generateSmartFallback(input: AuraCharmInput): AuraCharmOutput {
  const isMale = input.gender === '남성' || input.gender?.toLowerCase().startsWith('m');
  const hobbiesStr = input.hobbies && input.hobbies.length > 0 ? input.hobbies[0] : '카페 투어';
  
  return {
    auraScore: 96,
    percentile: 3,
    title: isMale ? '따뜻한 도시의 라떼남 ☕' : '햇살 머금은 청순 아우라 🌸',
    auraColor: isMale ? '골드 앰버 (Gold Amber)' : '로즈 쿼츠 (Rose Quartz)',
    keywords: isMale
      ? ['#세련된_미소', '#다정한_대화', `#${hobbiesStr}_감성`]
      : ['#맑고_깊은_눈빛', '#봄날의_온기', `#${hobbiesStr}_러버`],
    analysis: `${input.name}님은 마주하는 사람의 마음을 무장해제시키는 독보적인 온기와 세련된 분위기를 지니고 있습니다. 자연스러운 센스와 따뜻한 대화법이 상대방을 설레게 하는 최고의 매력 포인트입니다.`,
    bestMatchStyle: isMale
      ? '햇살처럼 밝고 감각적인 리액션을 지닌 감성 메이트'
      : '사려 깊고 듬직하며 대화의 결이 섬세하게 맞는 젠틀맨',
    dateRecommendation: '조용한 한남동 앤틱 카페에서 나누는 스페셜티 커피 & 산책 데이트',
  };
}

export async function getAuraCharmReport(input: AuraCharmInput): Promise<AuraCharmOutput> {
  try {
    return await auraCharmReportFlow(input);
  } catch (error) {
    console.error('AI aura charm report failed, returning smart fallback:', error);
    return generateSmartFallback(input);
  }
}

const auraCharmReportFlow = ai.defineFlow(
  {
    name: 'auraCharmReportFlow',
    inputSchema: AuraCharmInputSchema,
    outputSchema: AuraCharmOutputSchema,
  },
  async (input) => {
    const isMale = input.gender === '남성' || input.gender?.toLowerCase().startsWith('m');
    const prompt = `당신은 대한민국 최고급 데이팅 서비스 'AURA'의 수석 AI 비주얼 디렉터입니다.
사용자의 프로필 정보(이름, 성별, 나이, 자기소개, 취미, 관심사 등)를 심층 분석하여,
인스타그램 스토리에 자랑스럽게 공유하고 싶어지는 감각적이고 고급스러운 1장짜리 [나의 아우라(Aura) 매력 진단 리포트]를 작성하세요.

[분석 가이드라인]
1. 톤앤매너: 하이엔드 매거진(Vogue, GQ) 에디터처럼 우아하고, 극찬하되 과장되지 않으며 지적이고 세련된 어조.
2. auraScore: 93점에서 99점 사이의 높은 점수를 부여하세요.
3. percentile: 상위 1% ~ 4% 사이로 지정하세요.
4. title: 성별과 분위기에 어울리는 트렌디하고 감성적인 타이틀을 지어주세요 (이모지 1개 포함).
   - 남성 예시: "따뜻한 도시의 라떼남 ☕", "성수동 미니멀리스트 🎧", "단단한 내면의 지성파 📚", "청량한 여름날의 바람 🌊"
   - 여성 예시: "햇살 머금은 청순 아우라 🌸", "한남동 갤러리 큐레이터 🎨", "도회적인 우아함의 정석 🍷", "기분 좋은 봄바람 🌿"
5. keywords: 인스타 해시태그 3개 ('#단어' 형태).
6. analysis: 상대방이 심쿵할 만한 매력 포인트 2~3문장.
7. bestMatchStyle: 나와 궁합 99%인 이성 스타일 1줄.
8. dateRecommendation: 둘의 매력이 극대화되는 감성 데이트 코스 1줄.

[사용자 프로필]
- 이름: ${input.name}
- 성별: ${input.gender}
- 나이: ${input.age ? `${input.age}세` : '미입력'}
- 자기소개: ${input.bio || '기본 정보'}
- 취미: ${input.hobbies?.join(', ') || '음악 감상, 맛집 탐방'}
- 관심사: ${input.interests?.join(', ') || '전시회, 카페, 여행'}
- 라이프스타일: ${input.lifestyle?.join(', ') || '여유로운 주말'}
- 가치관: ${input.values?.join(', ') || '서로를 존중하는 관계'}
`;

    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt,
      output: { schema: AuraCharmOutputSchema },
    });

    if (!output) {
      return generateSmartFallback(input);
    }

    return output;
  }
);
