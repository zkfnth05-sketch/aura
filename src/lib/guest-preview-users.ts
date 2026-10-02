import type { User } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { fromSupabaseUser } from '@/lib/supabaseMappers';

// 👑 [여성 1번 고정 에이스] 새벽이슬 (25세 · 서울 마포구)
export const ACE_GUEST_FEMALE: User = {
  id: '3XBoN9mDObOwzwYKrmat',
  name: '새벽이슬',
  age: 25,
  gender: '여성',
  location: '서울 마포구',
  lat: 37.5665,
  lng: 126.9255,
  bio: '음악 감상과 필라테스를 즐겨요 🎧 소소한 데이트와 솔직담백한 대화를 좋아합니다. 따뜻하게 배려해주는 분에게 끌려요 🌿',
  photoUrls: [
    'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/3XBoN9mDObOwzwYKrmat_0_1788952708846.jpg',
  ],
  hobbies: ['hobbies_section_title_music', 'hobbies_section_title_fitness', 'hobbies_section_title_cafe'],
  interests: ['interests_section_title_indie_music', 'interests_section_title_dessert', 'interests_section_title_art'],
  relationship: ['relationship_serious', 'relationship_dating'],
  values: ['values_growth', 'values_honesty', 'values_warmth'],
  lifestyle: ['lifestyle_active', 'lifestyle_health'],
  communication: ['communication_balanced', 'communication_deep_talk'],
  admissionStatus: 'active',
  lastSeen: '방금 전',
  language: 'ko',
};

// 👑 [남성 1번 고정 에이스] 심심한동네형 (25세 · 서울 마포구)
export const ACE_GUEST_MALE: User = {
  id: '1d5aa60c-0fe6-42f5-9222-220007f5a295',
  name: '심심한동네형',
  age: 25,
  gender: '남성',
  location: '서울 마포구',
  lat: 37.5665,
  lng: 126.9255,
  bio: '공간 디자이너입니다 📐 새로운 공간과 사진 찍는 걸 좋아해요. 함께 산책하며 기분 좋은 대화를 나눌 인연을 만나고 싶어요 📷',
  photoUrls: [
    'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/1790899970477_t9ruzqb.jpg',
  ],
  hobbies: ['hobbies_section_title_photo', 'hobbies_section_title_cafe', 'hobbies_section_title_exhibition'],
  interests: ['interests_section_title_coffee', 'interests_section_title_art', 'interests_section_title_indie_music'],
  relationship: ['relationship_dating', 'relationship_serious'],
  values: ['values_creativity', 'values_empathy', 'values_honesty'],
  lifestyle: ['lifestyle_cultural', 'lifestyle_aesthetic'],
  communication: ['communication_attentive', 'communication_gentle'],
  admissionStatus: 'active',
  lastSeen: '방금 전',
  language: 'ko',
};

// 🎲 2~3번 랜덤 후보 풀 (실제 Supabase 한국 여성 회원)
export const POOL_GUEST_FEMALE: User[] = [
  {
    id: 'lZh4ovGw4qxC9VfTNiFa',
    name: '웃음꽃',
    age: 24,
    gender: '여성',
    location: '서울 강남구',
    lat: 37.5172,
    lng: 127.0473,
    bio: '주말에 카페 투어와 전시회 다니는 걸 좋아해요 ☕ 대화가 잘 통하고 다정한 분과 좋은 인연 만들고 싶습니다 ✨',
    photoUrls: [
      'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/lZh4ovGw4qxC9VfTNiFa_0_1788952719775.jpg',
    ],
    hobbies: ['hobbies_section_title_cafe', 'hobbies_section_title_exhibition', 'hobbies_section_title_photo'],
    interests: ['interests_section_title_foodie', 'interests_section_title_music', 'interests_section_title_travel'],
    relationship: ['relationship_dating', 'relationship_serious'],
    values: ['values_kindness', 'values_communication', 'values_respect'],
    lifestyle: ['lifestyle_weekend_out', 'lifestyle_early_bird'],
    communication: ['communication_frequent', 'communication_warm'],
    admissionStatus: 'active',
    lastSeen: '2분 전',
    language: 'ko',
  },
  {
    id: 'tknUWMqcvVlGJFy8cEsk',
    name: '젤리푸딩',
    age: 27,
    gender: '여성',
    location: '경기 성남시 판교',
    lat: 37.3947,
    lng: 127.1111,
    bio: '판교에서 IT 직무를 하고 있어요 🎨 맛있는 디저트와 산책 메이트 구해요! 서로의 취향을 존중하는 다정한 분이 좋아요 💖',
    photoUrls: [
      'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/tknUWMqcvVlGJFy8cEsk_0_1788952722900.jpg',
    ],
    hobbies: ['hobbies_section_title_running', 'hobbies_section_title_cooking', 'hobbies_section_title_travel'],
    interests: ['interests_section_title_design', 'interests_section_title_wine', 'interests_section_title_dining'],
    relationship: ['relationship_dating', 'relationship_serious'],
    values: ['values_growth', 'values_honesty', 'values_passion'],
    lifestyle: ['lifestyle_active', 'lifestyle_health'],
    communication: ['communication_frequent', 'communication_expressive'],
    admissionStatus: 'active',
    lastSeen: '5분 전',
    language: 'ko',
  },
  {
    id: 'w3xtT79jK8rdKTg3rsPS',
    name: '겨울이야기',
    age: 25,
    gender: '여성',
    location: '서울 송파구 잠실',
    lat: 37.5133,
    lng: 127.1001,
    bio: '반려견과 산책하는 일상을 사랑해요 🐶 웃음 코드가 맞고 긍정적인 에너지를 주고받을 수 있는 다정한 인연을 기다려요 🌸',
    photoUrls: [
      'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/w3xtT79jK8rdKTg3rsPS_0_1788952723570.jpg',
    ],
    hobbies: ['hobbies_section_title_pet', 'hobbies_section_title_cooking', 'hobbies_section_title_movie'],
    interests: ['interests_section_title_walk', 'interests_section_title_dessert', 'interests_section_title_camping'],
    relationship: ['relationship_serious', 'relationship_dating'],
    values: ['values_kindness', 'values_warmth', 'values_family'],
    lifestyle: ['lifestyle_pet_lover', 'lifestyle_cozy'],
    communication: ['communication_warm', 'communication_attentive'],
    admissionStatus: 'active',
    lastSeen: '8분 전',
    language: 'ko',
  },
  {
    id: 'vvsVySyHgpDP3IeGl7O6',
    name: '비밀정원',
    age: 29,
    gender: '여성',
    location: '서울 용산구 한남',
    lat: 37.5340,
    lng: 127.0026,
    bio: '주말에 와인 한잔하며 깊은 대화를 나누는 걸 좋아해요. 유머 감각 있고 배울 점이 많은 분이 이상형이에요 🍷',
    photoUrls: [
      'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/vvsVySyHgpDP3IeGl7O6_0_1788952723276.jpg',
    ],
    hobbies: ['hobbies_section_title_wine', 'hobbies_section_title_travel', 'hobbies_section_title_exhibition'],
    interests: ['interests_section_title_dining', 'interests_section_title_culture', 'interests_section_title_golf'],
    relationship: ['relationship_serious'],
    values: ['values_growth', 'values_respect', 'values_integrity'],
    lifestyle: ['lifestyle_fine_dining', 'lifestyle_weekend_out'],
    communication: ['communication_mature', 'communication_deep_talk'],
    admissionStatus: 'active',
    lastSeen: '12분 전',
    language: 'ko',
  },
];

// 🎲 2~3번 랜덤 후보 풀 (실제 Supabase 한국 남성 회원)
export const POOL_GUEST_MALE: User[] = [
  {
    id: '06d97616-cc4d-468b-9b29-b3d5c328fa88',
    name: '미드나잇',
    age: 28,
    gender: '남성',
    location: '서울 강남구',
    lat: 37.5172,
    lng: 127.0473,
    bio: '금융권 직장인입니다 📈 운동과 재즈 음악, 와인을 좋아합니다. 서로에게 든든한 버팀목이 되어줄 진지한 만남을 희망합니다 🍷',
    photoUrls: [
      'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/1790899898468_0wt2hfe.jpg',
    ],
    hobbies: ['hobbies_section_title_fitness', 'hobbies_section_title_wine', 'hobbies_section_title_jazz'],
    interests: ['interests_section_title_economy', 'interests_section_title_dining', 'interests_section_title_golf'],
    relationship: ['relationship_serious'],
    values: ['values_integrity', 'values_respect', 'values_family'],
    lifestyle: ['lifestyle_fitness', 'lifestyle_fine_dining'],
    communication: ['communication_mature', 'communication_deep_talk'],
    admissionStatus: 'active',
    lastSeen: '2분 전',
    language: 'ko',
  },
  {
    id: 'iG82plBTPqaHcEKOgCPm',
    name: '도윤',
    age: 29,
    gender: '남성',
    location: '서울 성동구 성수',
    lat: 37.5445,
    lng: 127.0560,
    bio: '스타트업 개발자입니다 💻 주말에는 맛집 탐방과 드라이브를 즐겨요. 사소한 일상도 소중하게 나눌 수 있는 따뜻한 분을 찾고 있습니다 ☕',
    photoUrls: [
      'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/iG82plBTPqaHcEKOgCPm_0_1788952717056.jpg',
    ],
    hobbies: ['hobbies_section_title_drive', 'hobbies_section_title_cafe', 'hobbies_section_title_music'],
    interests: ['interests_section_title_tech', 'interests_section_title_foodie', 'interests_section_title_travel'],
    relationship: ['relationship_serious', 'relationship_dating'],
    values: ['values_responsibility', 'values_communication', 'values_caring'],
    lifestyle: ['lifestyle_balanced', 'lifestyle_weekend_drive'],
    communication: ['communication_thoughtful', 'communication_warm'],
    admissionStatus: 'active',
    lastSeen: '5분 전',
    language: 'ko',
  },
  {
    id: 'mIld1ALd6w57m9l1vTVA',
    name: '콜드브루',
    age: 33,
    gender: '남성',
    location: '서울 송파구 잠실',
    lat: 37.5133,
    lng: 127.1001,
    bio: '대기업 연구원입니다 🔬 주말엔 테니스와 헬스를 즐겨요. 긍정적이고 밝은 분과 예쁜 연애 하고 싶습니다 🎾',
    photoUrls: [
      'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/mIld1ALd6w57m9l1vTVA_0_1788952720205.jpg',
    ],
    hobbies: ['hobbies_section_title_fitness', 'hobbies_section_title_tennis', 'hobbies_section_title_drive'],
    interests: ['interests_section_title_health', 'interests_section_title_foodie', 'interests_section_title_tech'],
    relationship: ['relationship_serious', 'relationship_dating'],
    values: ['values_responsibility', 'values_caring', 'values_growth'],
    lifestyle: ['lifestyle_active', 'lifestyle_healthy'],
    communication: ['communication_warm', 'communication_frequent'],
    admissionStatus: 'active',
    lastSeen: '10분 전',
    language: 'ko',
  },
  {
    id: 'pepuiluZg9rxfCC2IW2g',
    name: '블랙홀릭',
    age: 32,
    gender: '남성',
    location: '서울 강서구',
    lat: 37.5509,
    lng: 126.8495,
    bio: '드라이브와 캠핑을 좋아해요 🏕️ 진솔하고 솔직한 만남을 희망합니다 ✨',
    photoUrls: [
      'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/pepuiluZg9rxfCC2IW2g_0_1788952721174.jpg',
    ],
    hobbies: ['hobbies_section_title_drive', 'hobbies_section_title_camping'],
    interests: ['interests_section_title_travel', 'interests_section_title_music'],
    relationship: ['relationship_serious'],
    values: ['values_honesty', 'values_respect'],
    lifestyle: ['lifestyle_active'],
    communication: ['communication_warm'],
    admissionStatus: 'active',
    lastSeen: '15분 전',
    language: 'ko',
  },
];

export const CURATED_GUEST_FEMALE_PROFILES: User[] = [ACE_GUEST_FEMALE, ...POOL_GUEST_FEMALE];
export const CURATED_GUEST_MALE_PROFILES: User[] = [ACE_GUEST_MALE, ...POOL_GUEST_MALE];

/**
 * 100% 실제 Supabase DB 한국인 정회원 노출 알고리즘 (지정 에이스 고정):
 * - 여성 1번 에이스: '새벽이슬' (25세, 서울)
 * - 남성 1번 에이스: '한수' (29세, 서울)
 * - 2~3번 카드: 실제 DB 회원 풀에서 무작위 2명 셔플
 */
export async function fetchGuestPreviewProfiles(targetGender: '여성' | '남성' = '여성'): Promise<User[]> {
  const isFemale = targetGender === '여성';
  const ace = isFemale ? ACE_GUEST_FEMALE : ACE_GUEST_MALE;
  const pool = isFemale ? POOL_GUEST_FEMALE : POOL_GUEST_MALE;

  let liveRealUsers: User[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('gender', targetGender)
        .neq('admission_status', 'queued')
        .neq('admission_status', 'expired')
        .not('photo_urls', 'is', null)
        .limit(20);

      if (!error && data && data.length > 0) {
        liveRealUsers = data
          .map(fromSupabaseUser)
          .filter(
            (u) =>
              u.photoUrls &&
              u.photoUrls.length > 0 &&
              u.name &&
              u.age &&
              !u.name.match(/^[a-zA-Z\s]+$/) &&
              u.name !== ace.name
          );
      }
    } catch (err) {
      console.warn('Supabase guest live fetch warning:', err);
    }
  }

  // 2~3번 카드를 위한 실제 한국인 회원 풀 결합
  const poolList = [...liveRealUsers, ...pool];
  const uniqueMap = new Map<string, User>();
  for (const u of poolList) {
    if (u.name !== ace.name && !uniqueMap.has(u.name)) {
      uniqueMap.set(u.name, u);
    }
  }

  // 2명 무작위 셔플
  const shuffled = Array.from(uniqueMap.values()).sort(() => Math.random() - 0.5);
  const randomTwo = shuffled.slice(0, 2);

  return [ace, ...randomTwo];
}
