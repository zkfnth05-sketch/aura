'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import PwaInstallButton from '@/components/pwa-install-button';

export default function Header() {
  const router = useRouter();
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const { t } = useLanguage();

  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => {
      router.push('/admin');
    }, 5000); // 5 seconds
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-14 max-w-screen-sm items-center justify-between px-3 sm:px-4">
        {/* Left: AI Recommendation */}
        <div className="flex items-center justify-start z-10">
          <Link 
            href="/ai" 
            className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm shrink-0"
          >
            <span>✨</span>
            <span>{t('ai_rec_button')}</span>
          </Link>
        </div>

        {/* Center: Aura Logo - STRICTLY CENTERED ABSOLUTELY */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          <Link href="/" className="flex items-center justify-center gap-2">
            <span className="font-headline text-3xl font-extrabold bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(229,169,52,0.35)] select-none">
              Aura
            </span>
          </Link>
        </div>

        {/* Right: PWA Install Button + Filter Icon */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 z-10">
          <PwaInstallButton />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/filter" aria-label="필터 설정">
              <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
