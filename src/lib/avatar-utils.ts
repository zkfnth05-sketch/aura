export const DEFAULT_MALE_AVATAR = '/avatars/default-male.png';
export const DEFAULT_FEMALE_AVATAR = '/avatars/default-female.png';

/**
 * 주어진 사진 URL이 기본 일러스트/실루엣 아바타인지 판별합니다.
 */
export function isDefaultAvatar(photoUrl?: string | null): boolean {
  if (!photoUrl) return true;
  return photoUrl.includes('default-male') || 
         photoUrl.includes('default-female') || 
         photoUrl.includes('default-avatar');
}

/**
 * 성별에 따른 기본 아바타 URL을 반환합니다.
 */
export function getDefaultAvatarByGender(gender?: string | null): string {
  if (gender === '여성') {
    return DEFAULT_FEMALE_AVATAR;
  }
  return DEFAULT_MALE_AVATAR;
}

