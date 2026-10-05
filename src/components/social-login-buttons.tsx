'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signInWithKakao, signInWithGoogle } from '@/lib/socialAuthService';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

// Kakao Symbol SVG (Official)
const KakaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2 flex-shrink-0">
    <path d="M12 3C6.477 3 2 6.477 2 10.767c0 2.766 1.874 5.187 4.697 6.545-.207.76-.75 2.756-.86 3.18-.135.53.194.523.408.381.168-.112 2.68-1.82 3.754-2.553.649.095 1.32.147 2.001.147 5.523 0 10-3.477 10-7.767C22 6.477 17.523 3 12 3z" />
  </svg>
);

// Google Symbol SVG (Official 4-color)
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="mr-2 flex-shrink-0">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
    <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
  </svg>
);

// Phone Icon SVG
const PhoneIcon = () => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2 flex-shrink-0"
  >
    <path d="M3.56778 8.16334C4.85732 10.6276 6.9602 12.7305 9.42452 14.0199L11.5933 11.8512C11.7997 11.6448 12.1026 11.5833 12.367 11.6911C13.2676 12.0463 14.2384 12.25 15.25 12.25C15.6642 12.25 16 12.5858 16 13V16.5C16 16.9142 15.6642 17.25 15.25 17.25C8.48122 17.25 3 11.7688 3 5C3 4.58579 3.33579 4.25 3.75 4.25H7.25C7.66421 4.25 8 4.58579 8 5C8 6.01156 8.20374 6.98236 8.55887 7.88296C8.66668 8.14736 8.60523 8.45025 8.39884 8.65664L6.23011 10.8254C6.23011 10.8254 3.56778 8.16334 3.56778 8.16334Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface SocialLoginButtonsProps {
  className?: string;
  showPhoneOption?: boolean;
}

export function SocialLoginButtons({ className = '', showPhoneOption = true }: SocialLoginButtonsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true);
    try {
      const { error } = await signInWithKakao();
      if (error) {
        toast({
          variant: 'destructive',
          title: t('auth_kakao_error_title'),
          description: error.message || t('auth_kakao_error_failed'),
        });
        setIsKakaoLoading(false);
      }
    } catch (e: any) {
      console.error('Kakao login button error:', e);
      toast({
        variant: 'destructive',
        title: t('auth_kakao_error_title'),
        description: t('auth_kakao_error_failed'),
      });
      setIsKakaoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          variant: 'destructive',
          title: t('auth_google_error_title'),
          description: error.message || t('auth_google_error_failed'),
        });
        setIsGoogleLoading(false);
      }
    } catch (e: any) {
      console.error('Google login button error:', e);
      toast({
        variant: 'destructive',
        title: t('auth_google_error_title'),
        description: t('auth_google_error_failed'),
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={`space-y-3 w-full ${className}`}>
      {/* 1. 카카오 3초 간편 로그인 (국내 유저 1순위) */}
      <Button
        onClick={handleKakaoLogin}
        disabled={isKakaoLoading || isGoogleLoading}
        type="button"
        className="w-full h-13 bg-[#FEE500] hover:bg-[#FDD800] active:bg-[#ECC600] text-[#191919] font-extrabold text-base rounded-full shadow-[0_4px_20px_rgba(254,229,0,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center border border-[#FEE500]"
      >
        {isKakaoLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#191919]" />
            <span>{t('connecting_kakao')}</span>
          </>
        ) : (
          <>
            <KakaoIcon />
            <span>{t('continue_with_kakao')}</span>
          </>
        )}
      </Button>

      {/* 2. Google 계정으로 계속하기 (글로벌/안드로이드 유저 1순위) */}
      <Button
        onClick={handleGoogleLogin}
        disabled={isKakaoLoading || isGoogleLoading}
        type="button"
        className="w-full h-13 bg-white hover:bg-neutral-100 active:bg-neutral-200 text-neutral-800 font-bold text-sm sm:text-base rounded-full shadow-[0_4px_16px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center border border-neutral-300"
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-neutral-600" />
            <span>{t('connecting_google')}</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>{t('continue_with_google')}</span>
          </>
        )}
      </Button>

      {/* 3. 전화번호로 계속하기 */}
      {showPhoneOption && (
        <Button
          onClick={() => router.push('/signup/phone')}
          variant="secondary"
          type="button"
          disabled={isKakaoLoading || isGoogleLoading}
          className="w-full h-12 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white font-medium text-xs sm:text-sm rounded-full border border-neutral-800 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center"
        >
          <PhoneIcon />
          <span>{t('continue_with_phone')}</span>
        </Button>
      )}
    </div>
  );
}
