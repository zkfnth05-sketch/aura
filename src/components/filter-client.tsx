'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import type { FilterSettings } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="py-5">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h2>
      <div>{children}</div>
    </div>
);
  
const TagButton = ({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) => (
    <Button
      variant={isSelected ? 'default' : 'secondary'}
      onClick={onClick}
      className={cn(
          "rounded-full h-auto py-2 px-4 text-sm font-normal",
          isSelected ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      )}
    >
      {label}
    </Button>
);

export default function FilterClient() {
    const router = useRouter();
    const { filters, updateFilters, resetFilters: resetGlobalFilters, isLoaded, user } = useUser();
    const { t } = useLanguage();
    
    const [localFilters, setLocalFilters] = useState<FilterSettings | null>(null);

    const allValues = {
      relationship: ['relationship_section_title_serious', 'relationship_section_title_casual', 'relationship_section_title_friends', 'relationship_section_title_chat'],
      values: ['values_section_title_adventure', 'values_section_title_stability', 'values_section_title_creativity', 'values_section_title_growth', 'values_section_title_authenticity', 'values_section_title_passion', 'values_section_title_calmness', 'values_section_title_humor'],
      communication: ['communication_section_title_deep', 'communication_section_title_witty', 'communication_section_title_sincere', 'communication_section_title_warm', 'communication_section_title_direct'],
      lifestyle: ['lifestyle_section_title_active', 'lifestyle_section_title_homebody', 'lifestyle_section_title_artist', 'lifestyle_section_title_wellness', 'lifestyle_section_title_explorer', 'lifestyle_section_title_minimalist'],
      hobbies: ['hobbies_section_title_movies', 'hobbies_section_title_music', 'hobbies_section_title_exercise', 'hobbies_section_title_cooking', 'hobbies_section_title_reading', 'hobbies_section_title_travel', 'hobbies_section_title_games', 'hobbies_section_title_camping', 'hobbies_section_title_watercolor', 'hobbies_section_title_baking', 'hobbies_section_title_coding', 'hobbies_section_title_piano', 'hobbies_section_title_scuba', 'hobbies_section_title_meditation'],
      interests: ['interests_section_title_foodie', 'interests_section_title_cafe', 'interests_section_title_photo', 'interests_section_title_fashion', 'interests_section_title_beauty', 'interests_section_title_finance', 'interests_section_title_self_dev', 'interests_section_title_drawing', 'interests_section_title_hiking', 'interests_section_title_classical', 'interests_section_title_yoga', 'interests_section_title_reading']
    };
    const genderOptions: ('남성' | '여성' | '기타')[] = ['남성', '여성', '기타'];


    useEffect(() => {
        if (isLoaded && user) {
            const isMale = user.gender === '남성' || user.gender?.toLowerCase().startsWith('m');
            const defaultGender: ('남성' | '여성' | '기타')[] = isMale ? ['여성'] : ['남성'];
            const effectiveGender: ('남성' | '여성' | '기타')[] = (filters.gender && filters.gender.length > 0) ? filters.gender : defaultGender;
            setLocalFilters({ ...filters, gender: effectiveGender });
        }
    }, [isLoaded, user, filters]);
    
    if (!isLoaded || !user || !localFilters) {
        return <main className="container pb-4 px-4 flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></main>;
    }

    const handleMultiSelect = (field: keyof FilterSettings, value: string) => {
        setLocalFilters(prev => {
            if (!prev) return null;
            const currentValues = prev[field] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };
    
    const handleGenderSelect = (value: '남성' | '여성' | '기타') => {
        setLocalFilters(prev => {
            if (!prev) return null;
            const currentValues = prev.gender;
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, gender: newValues };
        });
    };

    const handleAgeChange = (field: 'min' | 'max', value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            setLocalFilters(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    ageRange: { ...prev.ageRange, [field]: numValue }
                }
            });
        }
    };

    const handleApply = () => {
        if (localFilters) {
            updateFilters(localFilters);
        }
        router.push('/');
    };
    
    const handleReset = () => {
        const isMale = user?.gender === '남성' || user?.gender?.toLowerCase().startsWith('m');
        const defaultGender: ('남성' | '여성' | '기타')[] = isMale ? ['여성'] : ['남성'];
        const defaultFilters: FilterSettings = {
            ageRange: { min: 18, max: 99 },
            gender: defaultGender,
            relationship: [],
            values: [],
            communication: [],
            lifestyle: [],
            hobbies: [],
            interests: [],
        };
        resetGlobalFilters();
        setLocalFilters(defaultFilters);
    };

    return (
        <main className="container pb-24 px-4">
            <Section title={t('filter_age')}>
                <div className="flex items-center gap-4">
                    <Input 
                        type="number"
                        value={localFilters.ageRange.min}
                        onChange={e => handleAgeChange('min', e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-center"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input 
                        type="number"
                        value={localFilters.ageRange.max}
                        onChange={e => handleAgeChange('max', e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-center"
                    />
                </div>
            </Section>

            <Section title={t('filter_gender')}>
                <div className="flex flex-wrap gap-2">
                    <TagButton 
                        label={t('filter_gender_all')}
                        isSelected={localFilters.gender.length === 0 || localFilters.gender.length === genderOptions.length}
                        onClick={() => setLocalFilters(prev => prev ? {...prev, gender: []} : null)}
                    />
                    {genderOptions.map(gender => (
                        <TagButton 
                            key={gender} 
                            label={gender === '남성' ? t('gender_male') : gender === '여성' ? t('gender_female') : t('gender_other')}
                            isSelected={localFilters.gender.includes(gender)}
                            onClick={() => handleGenderSelect(gender)}
                        />
                    ))}
                </div>
            </Section>
            
            {Object.entries({
                'filter_relationship': 'relationship', 
                'filter_values': 'values', 
                'filter_communication': 'communication',
                'filter_lifestyle': 'lifestyle',
                'filter_hobbies': 'hobbies',
                'filter_interests': 'interests'
            }).map(([titleKey, key]) => (
                <Section key={key} title={t(titleKey as any)}>
                    <div className="flex flex-wrap gap-2">
                        {allValues[key as keyof typeof allValues].map(itemKey => (
                            <TagButton 
                                key={itemKey}
                                label={t(itemKey as any)}
                                isSelected={(localFilters[key as keyof typeof localFilters] as string[]).includes(itemKey)}
                                onClick={() => handleMultiSelect(key as keyof FilterSettings, itemKey)}
                            />
                        ))}
                    </div>
                </Section>
            ))}

             <div className="py-4">
                <div className="flex w-full gap-2">
                    <Button variant="secondary" onClick={handleReset} className="flex-1 h-12 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg">{t('filter_reset')}</Button>
                    <Button onClick={handleApply} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg">{t('filter_apply')}</Button>
                </div>
            </div>

        </main>
    );
}
