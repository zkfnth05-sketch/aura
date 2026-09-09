
export type Timestamp = {
  toDate: () => Date;
  toMillis?: () => number;
  seconds?: number;
  nanoseconds?: number;
};

export type User = {
  id: string;
  name: string;
  email?: string;
  age: number;
  location: string;
  lat: number;
  lng: number;
  bio: string;
  hobbies: string[];
  interests: string[];
  photoUrls: string[];
  videoUrls?: string[];
  gender: '남성' | '여성' | '기타';
  language?: 'ko' | 'en' | 'es' | 'ja';
  relationship?: string[];
  values?: string[];
  communication?: string[];
  lifestyle?: string[];
  lastSeen?: 'Online' | string; // 'Online' or ISO 8601 date string
  createdAt?: Timestamp;
  phoneNumber?: string;
  pushSubscriptions?: any[];
  blockedUsers?: string[];
  completedCoachMarks?: string[];
};

export type Match = {
  id: string;
  users: string[];
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  lastMessageSenderId?: string;
  unreadCounts: { [key: string]: number };
  matchDate: Timestamp;
  callStatus?: 'idle' | 'ringing' | 'active';
  callerId?: string | null;
};

export type Message = {
  id: string;
  senderId: string;
  text?: string;
  audioUrl?: string;
  timestamp: Timestamp | any;
  senderLanguage?: 'ko' | 'en' | 'es' | 'ja';
  translations?: {
    ko?: string;
    en?: string;
    es?: string;
    ja?: string;
  };
};

export type Like = {
    likerId: string;
    likeeId: string;
    isLike: boolean;
    timestamp: Timestamp;
};

// This type is no longer used with the new top-level 'likes' collection.
// It can be removed if no other part of the app depends on it.
export type LikedBy = {
    id: string;
    likerId: string;
    timestamp: Timestamp;
};

export type QuestCategory = 'coffee' | 'food' | 'drink' | 'activity' | 'walk';

export type QuestPin = {
  id: string;
  creatorId: string;
  creator?: User;
  creatorGender?: '남성' | '여성' | string;
  title: string;
  category: QuestCategory;
  description?: string;
  approxLat: number;
  approxLng: number;
  meetupTime?: string;
  createdAt: string;
  expiresAt: string;
  status: 'open' | 'matched' | 'expired';
};

export type QuestApplication = {
  id: string;
  questId: string;
  applicantId: string;
  applicant?: User;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
};

