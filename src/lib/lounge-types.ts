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
    userId: 'user-jenny',
    userName: '민지',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    userAge: 25,
    userGender: '여성',
    userLocation: '서울 성동구 (성수)',
    content: '주말에 드디어 가본 성수동 베이글집 🥯 웨이팅 1시간 했는데 크림치즈 한 입 먹자마자 피로 다 풀렸어요 ㅠㅠ 소금빵도 맛있고 날씨도 너무 좋아서 힐링 제대로 하고 온 날! 디저트 취향 비슷한 분이랑 같이 카페 투어 가고 싶네요 ✨',
    imageUrls: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['카페', '성수동', '디저트', '주말일상'],
    likesCount: 38,
    isLiked: false,
    commentsCount: 4,
    createdAt: '15분 전',
    isVip: true,
    auraScore: 94,
    comments: [
      {
        id: 'c-1-1',
        postId: 'post-1',
        userId: 'user-jun',
        userName: '준호',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        userAge: 28,
        userGender: '남성',
        content: '와 여기 코끼리베이글 근처 맞죠? 저도 빵지순례 다니는 거 완전 좋아하는데 취향 통하시네요!',
        createdAt: '10분 전'
      },
      {
        id: 'c-1-2',
        postId: 'post-1',
        userId: 'user-sua',
        userName: '수아',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        userAge: 24,
        userGender: '여성',
        content: '헐 여기 크림치즈 쫀득하니 진짜 대박이죠 ㅠㅠ!',
        createdAt: '5분 전'
      }
    ]
  },
  {
    id: 'post-2',
    userId: 'user-taehyun',
    userName: '태현',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    userAge: 29,
    userGender: '남성',
    userLocation: '서울 용산구 (한남)',
    content: '퇴근하고 필라테스 + 러닝 5km 오운완 🏃‍♂️ 땀 흘리고 시원한 바람 맞으면서 밤 산책할 때가 하루 중에 제일 개운하네요. 같이 가볍게 한강 러닝 메이트 하실 분 계실까요?',
    imageUrls: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['운동', '오운완', '한강러닝', '퇴근'],
    likesCount: 24,
    isLiked: false,
    commentsCount: 2,
    createdAt: '42분 전',
    isVip: true,
    auraScore: 91,
    comments: [
      {
        id: 'c-2-1',
        postId: 'post-2',
        userId: 'user-seoyeon',
        userName: '서연',
        userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
        userAge: 26,
        userGender: '여성',
        content: '저도 잠원 한강공원 자주 뛰는데 저녁에 뛰면 바람 너무 시원하죠!',
        createdAt: '20분 전'
      }
    ]
  },
  {
    id: 'post-3',
    userId: 'user-chaewon',
    userName: '채원',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
    userAge: 24,
    userGender: '여성',
    userLocation: '서울 마포구 (연남)',
    content: '우리 집 댕댕이 뽀송이랑 연트럴파크 산책 다녀왔어요 🐶 지나가는 사람마다 꼬리 흔들고 반겨서 귀여워 죽는 줄... 반려동물 키우시거나 강아지 좋아하는 분 환영해요!',
    imageUrls: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['반려견', '산책', '연남동', '멍스타그램'],
    likesCount: 52,
    isLiked: false,
    commentsCount: 5,
    createdAt: '1시간 전',
    isVip: true,
    auraScore: 98,
    comments: [
      {
        id: 'c-3-1',
        postId: 'post-3',
        userId: 'user-minwoo',
        userName: '민우',
        userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
        userAge: 27,
        userGender: '남성',
        content: '강아지 눈망울 너무 사랑스러워요 ㅠㅠ 저도 비숑 키우는데 반려견끼리 만나도 좋겠네요!',
        createdAt: '40분 전'
      }
    ]
  },
  {
    id: 'post-4',
    userId: 'user-dohyun',
    userName: '도현',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
    userAge: 31,
    userGender: '남성',
    userLocation: '서울 강남구 (신사)',
    content: '소소한 취향 이야기: 첫 데이트 때 북적거리는 핫플보다는 서로 목소리 잘 들리는 조용한 재즈 와인바를 선호하는 편이에요. 다들 첫 만남 때 어떤 분위기를 가장 편하게 느끼시나요?',
    tags: ['연애고민', '취향', '데이트', '소통'],
    likesCount: 45,
    isLiked: false,
    commentsCount: 7,
    createdAt: '2시간 전',
    isVip: true,
    auraScore: 96,
    comments: [
      {
        id: 'c-4-1',
        postId: 'post-4',
        userId: 'user-yuna',
        userName: '유나',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        userAge: 27,
        userGender: '여성',
        content: '저도 너무 시끄러운 곳은 대화가 안 돼서 조용하고 음악 좋은 곳이 훨씬 진솔해서 좋아요 🥂',
        createdAt: '1시간 전'
      }
    ]
  }
];
