export interface MagazineSection {
  heading: string;
  body: string;
}

export interface MagazineArticle {
  id: number;
  category: string;
  categoryBadge: string;
  categoryIcon: string;
  title: string;
  subtitle: string;
  readTime: string;
  gradient: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  accentGlow: string;
  tags: string[];
  content: {
    intro: string;
    sections: MagazineSection[];
    auraFeature: string;
    auraFeatureDesc: string;
  };
}

export const INITIAL_MAGAZINE_ARTICLES: MagazineArticle[] = [
  {
    id: 1,
    category: 'kakaotalk_signals',
    categoryBadge: '카톡 시그널',
    categoryIcon: '💬',
    title: '소개팅 첫 카톡 읽씹을 피하는 호감형 첫인사 멘트 5가지',
    subtitle: '단답형 대화를 살려내는 실전 티키타카 핑퐁 법칙',
    readTime: '3분 읽기',
    gradient: 'from-rose-950/70 via-zinc-900 to-black',
    borderColor: 'border-rose-500/30 hover:border-rose-400/60',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    accentGlow: 'bg-rose-500/15',
    tags: ['#소개팅첫카톡', '#읽씹방지', '#티키타카'],
    content: {
      intro: '많은 2030 싱글들이 소개팅 전후 가장 긴장하는 순간은 바로 \'첫 카톡\'을 보낼 때입니다. 지나치게 격식을 차리면 어색해지고, 너무 가볍게 다가가면 성의 없어 보이기 십상이죠.',
      sections: [
        {
          heading: '1. 단순 질문 대신 \'공감 한 스푼 + 열린 질문\' 얹기',
          body: '\'주말 잘 보내셨어요?\'라는 막연한 질문보다, 상대방의 프로필이나 최근 날씨/주말 분위기에 공감하며 가벼운 디저트나 취향을 묻는 질문이 답장 확률을 80% 이상 끌어올립니다.'
        },
        {
          heading: '2. 상대방의 답장 템포(속도)와 글자 수 맞추기',
          body: '상대방이 2~3줄로 답장하면 나 역시 2~3줄로 호흡을 맞추는 것이 핵심입니다. 과도한 장문은 부담을 주고, 너무 짧은 단답은 대화를 차갑게 만듭니다.'
        },
        {
          heading: '3. 자연스러운 약속 빌드업 (음식 취향 핑퐁)',
          body: '\'언제 시간 되세요?\'라고 바로 날을 잡기보다, 좋아하는 음식이나 가보고 싶었던 성수/연남 핫플 이야기를 자연스럽게 꺼내며 \'거기 이번 주에 같이 가볼까요?\'로 연결하세요.'
        }
      ],
      auraFeature: 'Aura AI 카톡 답장 코칭 & 템포 분석기',
      auraFeatureDesc: '상대방의 카톡 캡처 한 장으로 속마음 호감도와 1초 만에 센스 있는 핑퐁 답장을 추천받아보세요.'
    }
  },
  {
    id: 2,
    category: 'date_spots',
    categoryBadge: '성수·연남 핫플',
    categoryIcon: '🍷',
    title: '첫 만남 실패 없는 성수·연남 조용한 분위기 와인바 TOP 4',
    subtitle: '어색한 침묵을 녹여주는 감성 조명과 시그니처 페어링',
    readTime: '4분 읽기',
    gradient: 'from-amber-950/70 via-zinc-900 to-black',
    borderColor: 'border-amber-500/30 hover:border-amber-400/60',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    accentGlow: 'bg-amber-500/15',
    tags: ['#성수소개팅', '#연남와인바', '#데이트코스'],
    content: {
      intro: '소개팅 1차 식사 후 2차로 이동할 때 너무 시끄러운 술집에 가면 깊은 대화를 나누기 어렵습니다. 조용한 조명과 은은한 음악이 흐르는 감성 스팟을 미리 챙겨두세요.',
      sections: [
        {
          heading: '1. 성수 아늑한 내추럴 와인바 큐레이션',
          body: '테이블 간 간격이 넓고 조도가 낮아 첫 만남의 어색한 시선 처리를 편안하게 만들어주는 성수 골목의 프라이빗 와인바를 엄선했습니다.'
        },
        {
          heading: '2. 연남 감성 테라스 & 글라스 와인 스팟',
          body: '보틀 주문이 부담스러운 첫 만남을 위해 수준 높은 글라스 와인과 가벼운 타파스 페어링이 가능한 감성 공간입니다.'
        },
        {
          heading: '3. 주말 예약 팁 & 웨이팅 없는 동선 짜기',
          body: '소개팅 당일 당황하지 않도록 캐치테이블 예약 꿀팁과 1차 장소에서 도보 5분 이내로 이어지는 쾌적한 동선을 추천합니다.'
        }
      ],
      auraFeature: 'Aura AI 주말 맞춤 데이트 코스 큐레이션',
      auraFeatureDesc: '두 사람의 음악·음식 취향을 조합하여 가장 완벽한 1차·2차 주말 데이트 코스를 3초 만에 설계해 드립니다.'
    }
  },
  {
    id: 3,
    category: 'conversation_skills',
    categoryBadge: '대화 치트키',
    categoryIcon: '🧠',
    title: '단답형 대화도 살려내는 2030 티키타카 심폐소생술',
    subtitle: '상대방의 마지막 단어를 이어받는 황금 핑퐁 공식',
    readTime: '3분 읽기',
    gradient: 'from-purple-950/70 via-zinc-900 to-black',
    borderColor: 'border-purple-500/30 hover:border-purple-400/60',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    accentGlow: 'bg-purple-500/15',
    tags: ['#스몰토크', '#대화치트키', '#어색함탈출'],
    content: {
      intro: '대화 도중 찾아오는 \'정적 3초\'는 소개팅에서 가장 식은땀이 나는 순간입니다. 새로운 질문을 쥐어짜내지 않고도 대화가 물 흐르듯 이어지는 대화 치트키를 소개합니다.',
      sections: [
        {
          heading: '1. 리피트 & 익스텐션(Repeat & Extension) 화법',
          body: '상대방이 \'저 지난주에 부산 다녀왔어요\'라고 하면, \'부산이요?\'(리피트)에 이어 \'광안리 쪽 가셨어요, 아니면 해운대 쪽?\'(익스텐션)으로 연결하는 순간 대화가 자연스럽게 폭발합니다.'
        },
        {
          heading: '2. 인터뷰 취조형 대화 탈피하기',
          body: '\'취미가 뭐예요?\', \'형제 관계가 어떻게 되세요?\' 같은 취조형 질문 대신, \'요즘 퇴근하고 제일 힐링되는 순간이 언제예요?\'처럼 감정을 묻는 질문을 던져보세요.'
        },
        {
          heading: '3. 부담 없는 가벼운 밸런스 게임 활용',
          body: '분위기가 살짝 풀렸을 때 가벼운 밸런스 게임 하나를 툭 던지면 서로의 연애 가치관을 웃으며 확인할 수 있습니다.'
        }
      ],
      auraFeature: 'Aura AI 실시간 밸런스 게임 & 대화 치트키',
      auraFeatureDesc: '상황별 침묵 탈출 스몰토크 질문과 2030 연애 밸런스 게임을 실시간으로 확인해보세요.'
    }
  },
  {
    id: 4,
    category: 'after_dating',
    categoryBadge: '애프터 공략',
    categoryIcon: '💘',
    title: '상대방이 먼저 애프터를 신청하게 만드는 여운 남기기',
    subtitle: '헤어질 때 다음 만남의 떡밥을 자연스럽게 남겨두는 기술',
    readTime: '5분 읽기',
    gradient: 'from-pink-950/70 via-zinc-900 to-black',
    borderColor: 'border-pink-500/30 hover:border-pink-400/60',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    accentGlow: 'bg-pink-500/15',
    tags: ['#애프터신청', '#삼프터고백', '#귀가카톡'],
    content: {
      intro: '첫 만남이 좋았다고 해서 집착하듯 애프터를 조르면 상대방은 부담을 느낍니다. 헤어지는 순간 가장 호감을 극대화하고 상대방이 먼저 다음 약속을 말하게 만드는 고단수 여운 화법입니다.',
      sections: [
        {
          heading: '1. 대화 중 \'미완의 떡밥\' 1개 남겨두기',
          body: '오늘 이야기 나눴던 맛집이나 전시회 중 하나를 완전히 결론짓지 말고, \'거기 진짜 맛있는데 나중에 시간 맞을 때 꼭 같이 가봐요\'라고 가벼운 여운을 던져두세요.'
        },
        {
          heading: '2. 귀가 후 첫 연락의 골든타임 (귀가 30분 후)',
          body: '헤어지자마자 바로 보내기보다는 집에 도착했을 즈음 \'오늘 덕분에 시간 가는 줄 몰랐어요. 조심히 들어가셨죠?\'라는 따뜻한 톤의 메시지가 가장 이상적입니다.'
        },
        {
          heading: '3. 삼프터 고백으로 이어지는 성공 시그널 감지',
          body: '카톡 답장 간격이 10분 이내로 줄어들고 주말 일정을 먼저 물어본다면 100% 그린라이트입니다. 머뭇거리지 말고 자연스럽게 다음 만남을 확정 지으세요.'
        }
      ],
      auraFeature: 'Aura AI 애프터 성공률 예측 모델',
      auraFeatureDesc: '첫 만남 분위기와 카톡 반응을 토대로 다음 만남 성사 확률과 최적의 고백 타이밍을 분석해 드립니다.'
    }
  }
];
