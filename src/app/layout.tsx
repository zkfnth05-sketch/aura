"use client";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from '@/contexts/user-context';
import AppLayout from '@/components/layout/app-layout';
import { LanguageProvider } from '@/contexts/language-context';
import { SelectedChatProvider } from '@/contexts/selected-chat-context';
import { EscapeCallProvider } from '@/contexts/escape-call-context';
import EscapeCallConfigDialog from '@/components/escape-call/escape-call-config-dialog';
import IncomingEscapeCallModal from '@/components/escape-call/incoming-escape-call-modal';
import InAppBrowserEscape from '@/components/in-app-browser-escape';
import { TrafficTracker } from '@/components/traffic-tracker';
import { useEffect } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('Service Worker registered with scope:', registration.scope))
            .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, []);

  return (
    <html lang="ko" className="dark h-full" suppressHydrationWarning>
      <head>
        <title>아우라 AI 데이팅 | 현재 100% 무료 - 50:50 클린 매칭 라운지</title>
        <meta name="description" content="탈출 전화는 물론! AI 화보, 매칭, 쪽지, 번개까지 Aura의 모든 기능을 현재 100% 무료 지원 중! 하트 과금 없는 50:50 황금 성비 AI 소개팅." />
        <meta name="keywords" content="아우라AI데이팅, 아우라 AI 데이팅, Aura AI Dating, 소개팅어플, 데이팅앱, 50:50성비, AI소개팅, 소개팅, 연애" />
        
        {/* Google Search Console & Naver Search Advisor Verification */}
        <meta name="google-site-verification" content="IHFjD1HlX9qQLUbwjrKPVdADPnoqgmEqBML05pV4STs" />
        <meta name="naver-site-verification" content="bdfdbb49416330fed9984611756191930df7697f" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#E5A934" />

        {/* Open Graph / KakaoTalk / Facebook / Instagram / Reddit */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Aura AI Dating" />
        <meta property="og:title" content="💖 아우라 AI 데이팅 | 현재 100% 무료" />
        <meta property="og:description" content="탈출 전화는 물론! AI 화보, 매칭, 쪽지, 번개까지 전 기능 현재 100% 무료 지원 중!" />
        <meta property="og:url" content="https://aura-ai-dating.vercel.app" />
        <meta property="og:image" content="https://aura-ai-dating.vercel.app/og-image.png" />
        <meta property="og:image:secure_url" content="https://aura-ai-dating.vercel.app/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="아우라 AI 데이팅 - 현재 100% 무료 지원 중" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Aura" />
        <meta name="twitter:title" content="💖 아우라 AI 데이팅 | 현재 100% 무료" />
        <meta name="twitter:description" content="탈출 전화는 물론! AI 화보, 매칭, 쪽지, 번개까지 전 기능 현재 100% 무료 지원 중!" />
        <meta name="twitter:image" content="https://aura-ai-dating.vercel.app/og-image.png" />

        {/* Structured Data (JSON-LD) for Google Rich Snippets & Instant Indexing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Aura AI Dating",
              "alternateName": ["아우라AI데이팅", "Aura Dating Korea"],
              "url": "https://aura-ai-dating.vercel.app",
              "description": "탈출 전화는 물론! AI 화보, 매칭, 쪽지, 번개까지 Aura의 모든 기능을 현재 100% 무료 지원 중! 하트 과금 없는 50:50 황금 성비 AI 소개팅.",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW"
              }
            })
          }}
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-body antialiased h-full bg-background text-foreground" suppressHydrationWarning>
        <TrafficTracker />
        <UserProvider>
          <LanguageProvider>
            <InAppBrowserEscape />
            <SelectedChatProvider>
              <EscapeCallProvider>
                <AppLayout>
                  {children}
                </AppLayout>
                <EscapeCallConfigDialog />
                <IncomingEscapeCallModal />
              </EscapeCallProvider>
            </SelectedChatProvider>
            <Toaster />
          </LanguageProvider>
        </UserProvider>
      </body>
    </html>
  );
}
