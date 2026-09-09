import type { User } from './types';

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
  if (user.createdAt !== undefined && (user.createdAt as any) !== 'serverTimestamp') {
    row.created_at = typeof user.createdAt === 'string' ? user.createdAt : new Date().toISOString();
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
    lastSeen: row.last_seen || 'Online',
    createdAt: row.created_at as any,
  };
}
