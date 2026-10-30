'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FilterClient from '@/components/filter-client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { useUser } from '@/contexts/user-context';
import { openMemberOnlyDialog } from '@/lib/member-only-gate';

export default function FilterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // 🎫 필터는 정회원 전용: 주소로 직접 들어온 게스트도 안내 후 홈으로 복귀
  useEffect(() => {
    if (isLoaded && !user) {
      openMemberOnlyDialog('feature_filter');
      router.replace('/');
    }
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen bg-black text-white">
        <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-sm flex items-center">
            <Link href="/" className="mr-2 p-2">
                <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-center flex-1">{t('filter_title')}</h1>
            <div className="w-10"></div>
        </header>
        <FilterClient />
    </div>
  );
}
