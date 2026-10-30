// 6대 카테고리 총 49개 태그 단일 진실 원천 (SSOT)
export interface ProfileTagCategory {
  key: 'relationship' | 'values' | 'communication' | 'lifestyle' | 'hobbies' | 'interests';
  titleKey: string;
  emoji: string;
  descriptionKey: string;
  options: { key: string; labelKey: string }[];
}

export const PROFILE_TAG_CATEGORIES: ProfileTagCategory[] = [
  {
    key: 'relationship',
    titleKey: 'relationship_section_title',
    emoji: '💖',
    descriptionKey: 'filter_relationship',
    options: [
      { key: 'relationship_section_title_serious', labelKey: 'relationship_serious' },
      { key: 'relationship_section_title_casual', labelKey: 'relationship_casual' },
      { key: 'relationship_section_title_friends', labelKey: 'relationship_friends' },
      { key: 'relationship_section_title_chat', labelKey: 'relationship_chat' },
    ],
  },
  {
    key: 'values',
    titleKey: 'values_section_title',
    emoji: '🌟',
    descriptionKey: 'filter_values',
    options: [
      { key: 'values_section_title_adventure', labelKey: 'values_adventure' },
      { key: 'values_section_title_stability', labelKey: 'values_stability' },
      { key: 'values_section_title_creativity', labelKey: 'values_creativity' },
      { key: 'values_section_title_growth', labelKey: 'values_growth' },
      { key: 'values_section_title_authenticity', labelKey: 'values_authenticity' },
      { key: 'values_section_title_passion', labelKey: 'values_passion' },
      { key: 'values_section_title_calmness', labelKey: 'values_calmness' },
      { key: 'values_section_title_humor', labelKey: 'values_humor' },
    ],
  },
  {
    key: 'communication',
    titleKey: 'communication_section_title',
    emoji: '💬',
    descriptionKey: 'filter_communication',
    options: [
      { key: 'communication_section_title_deep', labelKey: 'communication_deep' },
      { key: 'communication_section_title_witty', labelKey: 'communication_witty' },
      { key: 'communication_section_title_sincere', labelKey: 'communication_sincere' },
      { key: 'communication_section_title_warm', labelKey: 'communication_warm' },
      { key: 'communication_section_title_direct', labelKey: 'communication_direct' },
    ],
  },
  {
    key: 'lifestyle',
    titleKey: 'lifestyle_section_title',
    emoji: '🌿',
    descriptionKey: 'filter_lifestyle',
    options: [
      { key: 'lifestyle_section_title_active', labelKey: 'lifestyle_active' },
      { key: 'lifestyle_section_title_homebody', labelKey: 'lifestyle_homebody' },
      { key: 'lifestyle_section_title_artist', labelKey: 'lifestyle_artist' },
      { key: 'lifestyle_section_title_wellness', labelKey: 'lifestyle_wellness' },
      { key: 'lifestyle_section_title_explorer', labelKey: 'lifestyle_explorer' },
      { key: 'lifestyle_section_title_minimalist', labelKey: 'lifestyle_minimalist' },
    ],
  },
  {
    key: 'hobbies',
    titleKey: 'hobbies_section_title',
    emoji: '🎨',
    descriptionKey: 'filter_hobbies',
    options: [
      { key: 'hobbies_section_title_movies', labelKey: 'hobbies_movies' },
      { key: 'hobbies_section_title_music', labelKey: 'hobbies_music' },
      { key: 'hobbies_section_title_exercise', labelKey: 'hobbies_exercise' },
      { key: 'hobbies_section_title_cooking', labelKey: 'hobbies_cooking' },
      { key: 'hobbies_section_title_reading', labelKey: 'hobbies_reading' },
      { key: 'hobbies_section_title_travel', labelKey: 'hobbies_travel' },
      { key: 'hobbies_section_title_games', labelKey: 'hobbies_games' },
      { key: 'hobbies_section_title_camping', labelKey: 'hobbies_camping' },
      { key: 'hobbies_section_title_watercolor', labelKey: 'hobbies_watercolor' },
      { key: 'hobbies_section_title_baking', labelKey: 'hobbies_baking' },
      { key: 'hobbies_section_title_coding', labelKey: 'hobbies_coding' },
      { key: 'hobbies_section_title_piano', labelKey: 'hobbies_piano' },
      { key: 'hobbies_section_title_scuba', labelKey: 'hobbies_scuba' },
      { key: 'hobbies_section_title_meditation', labelKey: 'hobbies_meditation' },
    ],
  },
  {
    key: 'interests',
    titleKey: 'interests_section_title',
    emoji: '☕',
    descriptionKey: 'filter_interests',
    options: [
      { key: 'interests_section_title_foodie', labelKey: 'interests_foodie' },
      { key: 'interests_section_title_cafe', labelKey: 'interests_cafe' },
      { key: 'interests_section_title_photo', labelKey: 'interests_photo' },
      { key: 'interests_section_title_fashion', labelKey: 'interests_fashion' },
      { key: 'interests_section_title_beauty', labelKey: 'interests_beauty' },
      { key: 'interests_section_title_finance', labelKey: 'interests_finance' },
      { key: 'interests_section_title_self_dev', labelKey: 'interests_self_dev' },
      { key: 'interests_section_title_drawing', labelKey: 'interests_drawing' },
      { key: 'interests_section_title_hiking', labelKey: 'interests_hiking' },
      { key: 'interests_section_title_classical', labelKey: 'interests_classical' },
      { key: 'interests_section_title_yoga', labelKey: 'interests_yoga' },
      { key: 'interests_section_title_reading', labelKey: 'interests_reading' },
    ],
  },
];
