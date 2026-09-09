import type { User, Match, Message, Like, QuestPin, QuestApplication } from './types';

// Helper to provide a Timestamp-like object compatible with UI calling .toDate() or .toMillis()
export function toTimestampCompat(val: any): any {
  if (!val) {
    const now = new Date();
    return {
      toDate: () => now,
      toMillis: () => now.getTime(),
      seconds: Math.floor(now.getTime() / 1000),
      nanoseconds: 0,
    };
  }
  if (typeof val.toDate === 'function') {
    return val;
  }
  const d = typeof val === 'string' || typeof val === 'number' ? new Date(val) : (val instanceof Date ? val : new Date());
  return {
    toDate: () => d,
    toMillis: () => d.getTime(),
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: 0,
  };
}

export function toIsoString(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  return new Date().toISOString();
}

export function toSupabaseUser(user: Partial<User> & { id: string }): Record<string, any> {
  const row: Record<string, any> = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (user.name !== undefined) row.name = user.name;
  if (user.email !== undefined) row.email = user.email;
  if (user.phoneNumber !== undefined) row.phone_number = user.phoneNumber;
  if (user.age !== undefined) row.age = user.age;
  if (user.gender !== undefined) row.gender = user.gender;
  if (user.bio !== undefined) row.bio = user.bio;
  if (user.location !== undefined) row.location = user.location;
  if (user.lat !== undefined) row.lat = user.lat;
  if (user.lng !== undefined) row.lng = user.lng;
  if (user.language !== undefined) row.language = user.language;
  if (user.hobbies !== undefined) row.hobbies = user.hobbies;
  if (user.interests !== undefined) row.interests = user.interests;
  if (user.photoUrls !== undefined) row.photo_urls = user.photoUrls;
  if (user.videoUrls !== undefined) row.video_urls = user.videoUrls;
  if (user.relationship !== undefined) row.relationship = user.relationship;
  if (user.values !== undefined) row.values = user.values;
  if (user.communication !== undefined) row.communication = user.communication;
  if (user.lifestyle !== undefined) row.lifestyle = user.lifestyle;
  if (user.blockedUsers !== undefined) row.blocked_users = user.blockedUsers;
  if (user.completedCoachMarks !== undefined) row.completed_coach_marks = user.completedCoachMarks;
  if (user.pushSubscriptions !== undefined) row.push_subscriptions = user.pushSubscriptions;
  if (user.lastSeen !== undefined) row.last_seen = user.lastSeen;
  if (user.admissionStatus !== undefined) row.admission_status = user.admissionStatus;
  if (user.queuePosition !== undefined) row.queue_position = user.queuePosition;
  if (user.referralCode !== undefined) row.referral_code = user.referralCode;
  if (user.referredBy !== undefined) row.referred_by = user.referredBy;
  if (user.lastAppOpenedAt !== undefined) row.last_app_opened_at = user.lastAppOpenedAt;
  if (user.createdAt !== undefined && (user.createdAt as any) !== 'serverTimestamp') {
    row.created_at = toIsoString(user.createdAt);
  }

  return row;
}

export function fromSupabaseUser(row: Record<string, any>): User {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phoneNumber: row.phone_number || '',
    age: row.age || 25,
    gender: (row.gender as '남성' | '여성' | '기타') || '남성',
    bio: row.bio || '',
    location: row.location || '',
    lat: Number(row.lat) || 37.5665,
    lng: Number(row.lng) || 126.9780,
    language: row.language || 'ko',
    hobbies: Array.isArray(row.hobbies) ? row.hobbies : [],
    interests: Array.isArray(row.interests) ? row.interests : [],
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
    videoUrls: Array.isArray(row.video_urls) ? row.video_urls : [],
    relationship: Array.isArray(row.relationship) ? row.relationship : [],
    values: Array.isArray(row.values) ? row.values : [],
    communication: Array.isArray(row.communication) ? row.communication : [],
    lifestyle: Array.isArray(row.lifestyle) ? row.lifestyle : [],
    blockedUsers: Array.isArray(row.blocked_users) ? row.blocked_users : [],
    completedCoachMarks: Array.isArray(row.completed_coach_marks) ? row.completed_coach_marks : [],
    pushSubscriptions: Array.isArray(row.push_subscriptions) ? row.push_subscriptions : [],
    admissionStatus: row.admission_status || (row.gender === '여성' ? 'active' : 'queued'),
    queuePosition: row.queue_position !== undefined && row.queue_position !== null ? Number(row.queue_position) : undefined,
    referralCode: row.referral_code || undefined,
    referredBy: row.referred_by || undefined,
    lastAppOpenedAt: row.last_app_opened_at || undefined,
    lastSeen: row.last_seen || 'Online',
    createdAt: toTimestampCompat(row.created_at),
  };
}

export function toSupabaseMatch(match: Partial<Match> & { id: string }): Record<string, any> {
  const row: Record<string, any> = {
    id: match.id,
  };
  if (match.users !== undefined) row.users = match.users;
  if (match.lastMessage !== undefined) row.last_message = match.lastMessage;
  if (match.lastMessageTimestamp !== undefined) row.last_message_timestamp = toIsoString(match.lastMessageTimestamp);
  if (match.lastMessageSenderId !== undefined) row.last_message_sender_id = match.lastMessageSenderId;
  if (match.unreadCounts !== undefined) row.unread_counts = match.unreadCounts;
  if (match.matchDate !== undefined) row.match_date = toIsoString(match.matchDate);
  if (match.callStatus !== undefined) row.call_status = match.callStatus;
  if (match.callerId !== undefined) row.caller_id = match.callerId;
  return row;
}

export function fromSupabaseMatch(row: Record<string, any>): Match {
  return {
    id: row.id,
    users: Array.isArray(row.users) ? row.users : [],
    lastMessage: row.last_message || '',
    lastMessageTimestamp: toTimestampCompat(row.last_message_timestamp || row.match_date),
    lastMessageSenderId: row.last_message_sender_id || undefined,
    unreadCounts: typeof row.unread_counts === 'object' && row.unread_counts !== null ? row.unread_counts : {},
    matchDate: toTimestampCompat(row.match_date || row.created_at),
    callStatus: row.call_status || 'idle',
    callerId: row.caller_id || null,
  };
}

export function toSupabaseMessage(msg: {
  id?: string;
  matchId: string;
  senderId: string;
  text?: string;
  audioUrl?: string;
  senderLanguage?: string;
  translations?: Record<string, any>;
  timestamp?: any;
}): Record<string, any> {
  const row: Record<string, any> = {
    match_id: msg.matchId,
    sender_id: msg.senderId,
    text: msg.text || '',
    audio_url: msg.audioUrl || null,
    sender_language: msg.senderLanguage || 'ko',
    translations: msg.translations || {},
    created_at: toIsoString(msg.timestamp || new Date()),
  };
  if (msg.id) row.id = msg.id;
  return row;
}

export function fromSupabaseMessage(row: Record<string, any>): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.text || '',
    audioUrl: row.audio_url || undefined,
    timestamp: toTimestampCompat(row.created_at),
    senderLanguage: row.sender_language || 'ko',
    translations: row.translations || {},
  };
}

export function fromSupabaseLike(row: Record<string, any>): Like {
  return {
    likerId: row.liker_id,
    likeeId: row.likee_id,
    isLike: Boolean(row.is_like),
    timestamp: toTimestampCompat(row.created_at),
  };
}

export function fromSupabaseQuestPin(row: Record<string, any>, creatorUser?: User): QuestPin {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creator: creatorUser,
    creatorGender: creatorUser?.gender || row.creator_gender || undefined,
    title: row.title,
    category: row.category,
    description: row.description || '',
    approxLat: Number(row.approx_lat),
    approxLng: Number(row.approx_lng),
    meetupTime: row.meetup_time || '',
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    status: row.status || 'open',
  };
}

export function toSupabaseQuestPin(quest: Partial<QuestPin>): Record<string, any> {
  const row: Record<string, any> = {};
  if (quest.id) row.id = quest.id;
  if (quest.creatorId !== undefined) row.creator_id = quest.creatorId;
  if (quest.title !== undefined) row.title = quest.title;
  if (quest.category !== undefined) row.category = quest.category;
  if (quest.description !== undefined) row.description = quest.description;
  if (quest.approxLat !== undefined) row.approx_lat = quest.approxLat;
  if (quest.approxLng !== undefined) row.approx_lng = quest.approxLng;
  if (quest.meetupTime !== undefined) row.meetup_time = quest.meetupTime;
  if (quest.status !== undefined) row.status = quest.status;
  if (quest.expiresAt !== undefined) row.expires_at = quest.expiresAt;
  return row;
}

export function fromSupabaseQuestApplication(row: Record<string, any>, applicantUser?: User): QuestApplication {
  return {
    id: row.id,
    questId: row.quest_id,
    applicantId: row.applicant_id,
    applicant: applicantUser,
    message: row.message || '',
    status: row.status || 'pending',
    createdAt: row.created_at,
  };
}

