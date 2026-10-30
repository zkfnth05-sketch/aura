'use client';

import React from 'react';
import { useLanguage } from '@/contexts/language-context';
import { PROFILE_TAG_CATEGORIES, ProfileTagCategory } from '@/lib/tag-constants';
import type { TranslationKeys } from '@/lib/locales';

export interface ProfileTagValues {
  relationship?: string[];
  values?: string[];
  communication?: string[];
  lifestyle?: string[];
  hobbies?: string[];
  interests?: string[];
}

export interface ProfileTagsSelectorProps {
  values: ProfileTagValues;
  onChange: (categoryKey: keyof ProfileTagValues, selectedKeys: string[]) => void;
  maxPerCategory?: number;
  readOnly?: boolean;
}

export default function ProfileTagsSelector({
  values,
  onChange,
  maxPerCategory,
  readOnly = false,
}: ProfileTagsSelectorProps) {
  const { t } = useLanguage();

  const handleToggle = (categoryKey: keyof ProfileTagValues, tagKey: string) => {
    if (readOnly) return;
    const currentList = values[categoryKey] || [];
    const isSelected = currentList.includes(tagKey);

    if (isSelected) {
      onChange(
        categoryKey,
        currentList.filter((k) => k !== tagKey)
      );
      return;
    }

    if (maxPerCategory && currentList.length >= maxPerCategory) {
      return;
    }
    onChange(categoryKey, [...currentList, tagKey]);
  };

  return (
    <div className="space-y-6">
      {PROFILE_TAG_CATEGORIES.map((category: ProfileTagCategory) => {
        const catKey = category.key as keyof ProfileTagValues;
        const selectedList = values[catKey] || [];

        return (
          <div key={category.key} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label={category.key}>
                  {category.emoji}
                </span>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {t(category.titleKey as TranslationKeys)}
                </h3>
              </div>
              <span className="text-xs text-zinc-500">
                {t('multiple_selection_description' as TranslationKeys)}
                {maxPerCategory ? t('tag_max_limit' as TranslationKeys).replace('%d', String(maxPerCategory)) : ''}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {category.options.map((option) => {
                const isSelected = selectedList.includes(option.key);
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleToggle(catKey, option.key)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/80 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    } ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    {t(option.key as TranslationKeys)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
