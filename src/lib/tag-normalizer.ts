// 태그 정규화 모듈 — 프로필 태그의 "표준 키" 형식 통일 단일 출처.
//
// 표준 형식: `${category}_section_title_${name}` (프로필 편집 폼/필터 화면이 사용하는 형식)
// 실제 DB에는 과거 가입 경로에서 들어온 한글 리터럴('집순이' 등)과
// 카테고리가 뒤섞인 키(interests 필드에 들어간 hobbies_section_title_travel)가 존재하므로,
// 필터 매칭 시 양쪽을 동일한 표준 키로 변환해서 비교한다.

export type TagCategory =
  | 'relationship'
  | 'values'
  | 'communication'
  | 'lifestyle'
  | 'hobbies'
  | 'interests';

// DB 실측(2026-10)에서 확인된 레거시 한글 리터럴 → 표준 키
const LEGACY_TAG_MAP: Record<string, string> = {
  '가벼운 만남': 'relationship_section_title_casual',
  '창의성': 'values_section_title_creativity',
  '진솔함': 'communication_section_title_sincere',
  '집순이': 'lifestyle_section_title_homebody',
  '영화감상': 'hobbies_section_title_movies',
  '카페투어': 'interests_section_title_cafe',
  '맛집탐방': 'interests_section_title_foodie',
};

/** 임의 형식의 태그 문자열을 표준 키로 변환한다. 알 수 없는 값은 trim 한 원본을 그대로 반환. */
export function normalizeTag(tag: unknown): string {
  if (typeof tag !== 'string') return '';
  const trimmed = tag.trim();
  return LEGACY_TAG_MAP[trimmed] ?? trimmed;
}

/** 배열 필드를 표준 키 Set 으로 변환 (배열이 아니면 빈 Set). */
export function toNormalizedTagSet(value: unknown): Set<string> {
  const set = new Set<string>();
  if (!Array.isArray(value)) return set;
  for (const tag of value) {
    const normalized = normalizeTag(tag);
    if (normalized) set.add(normalized);
  }
  return set;
}

// hobbies / interests 는 실데이터에서 서로의 키가 교차 저장되어 있어(예: interests 필드의 hobbies_section_title_travel)
// 두 필드를 합쳐서 비교한다. 나머지 카테고리는 자기 필드만 비교한다.
const CROSS_MATCH: Partial<Record<TagCategory, TagCategory[]>> = {
  hobbies: ['hobbies', 'interests'],
  interests: ['hobbies', 'interests'],
};

export type TagFilterSelection = Partial<Record<TagCategory, string[]>>;

export const TAG_CATEGORIES: TagCategory[] = [
  'relationship',
  'values',
  'communication',
  'lifestyle',
  'hobbies',
  'interests',
];

/** 선택된 태그가 하나라도 있는지 */
export function hasTagFilter(selection: TagFilterSelection | undefined): boolean {
  if (!selection) return false;
  return TAG_CATEGORIES.some((c) => (selection[c]?.length ?? 0) > 0);
}

/**
 * 사용자 한 명이 선택한 필터와 몇 개의 태그가 일치하는지 센다.
 * - 같은 카테고리 안: 선택 태그 중 사용자가 가진 개수를 가산
 * - 일치 0개면 필터에서 탈락시키는 것은 호출자 책임 (이 함수는 점수만 계산)
 */
export function countTagMatches(
  userRow: Partial<Record<TagCategory, unknown>>,
  selection: TagFilterSelection
): number {
  let matches = 0;
  for (const category of TAG_CATEGORIES) {
    const selected = selection[category];
    if (!selected || selected.length === 0) continue;

    const sources = CROSS_MATCH[category] ?? [category];
    const userTags = new Set<string>();
    for (const src of sources) {
      for (const tag of toNormalizedTagSet(userRow[src])) userTags.add(tag);
    }

    for (const tag of selected) {
      if (userTags.has(normalizeTag(tag))) matches += 1;
    }
  }
  return matches;
}
