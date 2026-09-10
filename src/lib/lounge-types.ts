export interface LoungeComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userAge?: number;
  userGender?: '남성' | '여성' | '기타';
  content: string;
  createdAt: string;
}

export interface LoungePost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userAge?: number;
  userGender?: '남성' | '여성' | '기타';
  userLocation?: string;
  content: string;
  imageUrls?: string[];
  tags?: string[];
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments?: LoungeComment[];
  createdAt: string;
  isVip?: boolean;
  auraScore?: number;
}

export type LoungeCategory = 'all' | 'hot' | 'popular' | 'cafe' | 'workout' | 'fitness' | 'pet' | 'daily' | 'travel' | 'culture';

export const INITIAL_LOUNGE_POSTS: LoungePost[] = [
  {
    id: 'post-1',
    userId: '96RQydIg34IX1DPxoDWv',
    userName: '반짝반짝',
    userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/96RQydIg34IX1DPxoDWv_0_1788952692614.jpg',
    userAge: 29,
    userGender: '여성',
    userLocation: '서울',
    content: '주말에 드디어 가본 성수동 베이글집 🥯 웨이팅 1시간 했는데 크림치즈 한 입 먹자마자 피로 다 풀렸어요 ㅠㅠ 소금빵도 맛있고 날씨도 너무 좋아서 힐링 제대로 하고 온 날! 디저트 취향 비슷한 분이랑 같이 카페 투어 가고 싶네요 ✨',
    imageUrls: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['카페', '성수동', '디저트', '주말일상'],
    likesCount: 38,
    isLiked: false,
    commentsCount: 2,
    createdAt: '15분 전',
    isVip: true,
    auraScore: 97,
    comments: [
      {
        id: 'c-1-1',
        postId: 'post-1',
        userId: 'SGQtnYq1TpCv77REwTh0',
        userName: '프라임',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/SGQtnYq1TpCv77REwTh0_0_1788952699116.jpg',
        userAge: 28,
        userGender: '남성',
        content: '와 여기 코끼리베이글 근처 맞죠? 저도 빵지순례 다니는 거 완전 좋아하는데 취향 통하시네요!',
        createdAt: '10분 전'
      },
      {
        id: 'c-1-2',
        postId: 'post-1',
        userId: 'YZlwrZAQoOZ1SAl1VVIM',
        userName: '수아',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/YZlwrZAQoOZ1SAl1VVIM_0_1788952702725.jpg',
        userAge: 34,
        userGender: '여성',
        content: '헐 여기 크림치즈 쫀득하니 진짜 대박이죠 ㅠㅠ!',
        createdAt: '5분 전'
      }
    ]
  },
  {
    id: 'post-2',
    userId: '7SkCjrdeQvf0L9EDm6A1',
    userName: 'Neo',
    userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/7SkCjrdeQvf0L9EDm6A1_0_1788952692294.jpg',
    userAge: 35,
    userGender: '남성',
    userLocation: '서울',
    content: '퇴근하고 필라테스 + 러닝 5km 오운완 🏃‍♂️ 땀 흘리고 시원한 바람 맞으면서 밤 산책할 때가 하루 중에 제일 개운하네요. 같이 가볍게 한강 러닝 메이트 하실 분 계실까요?',
    imageUrls: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['운동', '오운완', '한강러닝', '퇴근'],
    likesCount: 29,
    isLiked: false,
    commentsCount: 1,
    createdAt: '42분 전',
    isVip: true,
    auraScore: 93,
    comments: [
      {
        id: 'c-2-1',
        postId: 'post-2',
        userId: 'TDfGdzl0FLedu3eLqsHh',
        userName: '하얀목화솜',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/TDfGdzl0FLedu3eLqsHh_0_1788952700703.jpg',
        userAge: 31,
        userGender: '여성',
        content: '저도 잠원 한강공원 자주 뛰는데 저녁에 뛰면 바람 너무 시원하죠!',
        createdAt: '20분 전'
      }
    ]
  },
  {
    id: 'post-3',
    userId: 'EOq5OEHehqt7bSfq8IlF',
    userName: '달빛조각사',
    userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/EOq5OEHehqt7bSfq8IlF_0_1788952694630.jpg',
    userAge: 25,
    userGender: '여성',
    userLocation: '서울',
    content: '우리 집 댕댕이 뽀송이랑 연트럴파크 산책 다녀왔어요 🐶 지나가는 사람마다 꼬리 흔들고 반겨서 귀여워 죽는 줄... 반려동물 키우시거나 강아지 좋아하는 분 환영해요!',
    imageUrls: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['반려견', '산책', '연남동', '멍스타그램'],
    likesCount: 64,
    isLiked: false,
    commentsCount: 2,
    createdAt: '1시간 전',
    isVip: true,
    auraScore: 99,
    comments: [
      {
        id: 'c-3-1',
        postId: 'post-3',
        userId: 'ZmeGEBe7xpoBjmKtYAYb',
        userName: '준우',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/ZmeGEBe7xpoBjmKtYAYb_0_1788952704127.jpg',
        userAge: 27,
        userGender: '남성',
        content: '강아지 눈망울 너무 사랑스러워요 ㅠㅠ 저도 비숑 키우는데 반려견끼리 산책 모임 해도 좋겠네요!',
        createdAt: '40분 전'
      }
    ]
  },
  {
    id: 'post-4',
    userId: 'IZGZp2KPihOre5qb3I9I',
    userName: '카이',
    userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/IZGZp2KPihOre5qb3I9I_0_1788952701591.jpg',
    userAge: 35,
    userGender: '남성',
    userLocation: '서울',
    content: '소소한 취향 이야기: 첫 데이트 때 북적거리는 핫플보다는 서로 목소리 잘 들리는 조용한 재즈 와인바를 선호하는 편이에요. 다들 첫 만남 때 어떤 분위기를 가장 편하게 느끼시나요? 🍷',
    imageUrls: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['연애고민', '취향', '데이트', '소통', '와인'],
    likesCount: 51,
    isLiked: false,
    commentsCount: 2,
    createdAt: '2시간 전',
    isVip: true,
    auraScore: 96,
    comments: [
      {
        id: 'c-4-1',
        postId: 'post-4',
        userId: '50dJcA4Jq6z8xqCwNCls',
        userName: '옆집소녀',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/50dJcA4Jq6z8xqCwNCls_0_1788952709702.jpg',
        userAge: 27,
        userGender: '여성',
        content: '저도 너무 시끄러운 곳은 대화가 안 돼서 조용하고 음악 좋은 곳이 훨씬 진솔해서 좋아요 🥂',
        createdAt: '1시간 전'
      }
    ]
  },
  {
    id: 'post-5',
    userId: 'AAOZg1Jz2zLDosPyWBLE',
    userName: '지현',
    userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/AAOZg1Jz2zLDosPyWBLE_0_1788952693292.jpg',
    userAge: 25,
    userGender: '여성',
    userLocation: '대전',
    content: '날씨가 너무 맑아서 오랜만에 미술관 전시 보러 왔어요 🎨 조용히 작품 감상하면서 생각 정리도 하고 커피 한 잔 마시니까 마음이 차분해지네요. 주말 문화생활 취향 맞는 분 계시면 좋겠어요!',
    imageUrls: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['문화', '전시', '미술관', '주말힐링'],
    likesCount: 42,
    isLiked: false,
    commentsCount: 1,
    createdAt: '3시간 전',
    isVip: true,
    auraScore: 95,
    comments: [
      {
        id: 'c-5-1',
        postId: 'post-5',
        userId: 'dHbWQVtSntPRaNmeyPD3',
        userName: '어반맨',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/dHbWQVtSntPRaNmeyPD3_0_1788952705651.jpg',
        userAge: 35,
        userGender: '남성',
        content: '빛 표현이 인상적인 전시네요! 저도 이번 주말에 보러 가려 했는데 추천 감사합니다.',
        createdAt: '2시간 전'
      }
    ]
  },
  {
    id: 'post-6',
    userId: 'Sk3B4LvIkHQkUnkuZBx9',
    userName: 'Leo',
    userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/Sk3B4LvIkHQkUnkuZBx9_0_1788952700089.jpg',
    userAge: 28,
    userGender: '남성',
    userLocation: '서울',
    content: '주말 동해 바다 드라이브 다녀왔습니다 🌊 파도 소리 들으면서 노을 보는데 답답했던 가슴이 뻥 뚫리는 기분이었네요. 즉흥 드라이브나 여행 좋아하시는 분 언제든 환영입니다!',
    imageUrls: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['여행', '바다', '드라이브', '노을'],
    likesCount: 37,
    isLiked: false,
    commentsCount: 1,
    createdAt: '4시간 전',
    isVip: true,
    auraScore: 92,
    comments: [
      {
        id: 'c-6-1',
        postId: 'post-6',
        userId: 'dC4qedMP9D8LiybNHQYt',
        userName: '선영',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/dC4qedMP9D8LiybNHQYt_0_1788952705267.jpg',
        userAge: 28,
        userGender: '여성',
        content: '바다 색깔 너무 영롱해요... 노을 타이밍 딱 맞춰서 가셨네요 최고!',
        createdAt: '3시간 전'
      }
    ]
  },
  {
    id: 'post-7',
    userId: 'dC4qedMP9D8LiybNHQYt',
    userName: '선영',
    userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/dC4qedMP9D8LiybNHQYt_0_1788952705267.jpg',
    userAge: 28,
    userGender: '여성',
    userLocation: '서울',
    content: '오늘 점심에 새로 생긴 브런치 카페 발견 🥑 에그베네딕트랑 생과일 주스 조합이 너무 좋았어요! 분위기도 아늑하고 사진도 예쁘게 나와서 기분전환 제대로 했답니다 ㅎㅎ',
    imageUrls: [
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['카페', '브런치', '맛집', '일상'],
    likesCount: 48,
    isLiked: false,
    commentsCount: 1,
    createdAt: '5시간 전',
    isVip: true,
    auraScore: 97,
    comments: [
      {
        id: 'c-7-1',
        postId: 'post-7',
        userId: '96RQydIg34IX1DPxoDWv',
        userName: '반짝반짝',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/96RQydIg34IX1DPxoDWv_0_1788952692614.jpg',
        userAge: 29,
        userGender: '여성',
        content: '어머 여기 위치 어디인가요?? 비주얼 대박이네요 꼭 가봐야겠어요!',
        createdAt: '4시간 전'
      }
    ]
  },
  {
    id: 'post-8',
    userId: 'HnmxsGg591Re3oE1MbcX',
    userName: '보랏빛노을',
    userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/HnmxsGg591Re3oE1MbcX_0_1788952701222.jpg',
    userAge: 29,
    userGender: '여성',
    userLocation: '서울',
    content: '오늘 퇴근길 하늘 보셨나요? 🌆 핑크빛이랑 보랏빛이 섞인 노을이 너무 예뻐서 한참을 멍하니 서서 바라봤어요. 소소하지만 이런 순간들이 하루의 큰 위로가 되네요.',
    imageUrls: [
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['일상', '퇴근길', '노을', '소소한행복', '오늘의무드'],
    likesCount: 56,
    isLiked: false,
    commentsCount: 1,
    createdAt: '6시간 전',
    isVip: true,
    auraScore: 98,
    comments: [
      {
        id: 'c-8-1',
        postId: 'post-8',
        userId: 'IZGZp2KPihOre5qb3I9I',
        userName: '카이',
        userAvatar: 'https://ncflciezowwpnknuutko.supabase.co/storage/v1/object/public/aura-media/profiles/IZGZp2KPihOre5qb3I9I_0_1788952701591.jpg',
        userAge: 35,
        userGender: '남성',
        content: '저도 퇴근하면서 봤는데 오늘 노을 정말 환상적이었죠. 하루 마무리 편안하게 하세요!',
        createdAt: '5시간 전'
      }
    ]
  }
];
