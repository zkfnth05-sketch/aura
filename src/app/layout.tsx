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
        <title>Aura - 50:50 성비 맞춤 & AI 데이팅</title>
        <meta name="description" content="50:50 성비 맞춤과 AI 사진 보정, 취향 저격 매칭부터 데이트 코스까지. 당신의 연애를 AI가 가이드합니다." />
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#E5A934" />

        {/* Open Graph / KakaoTalk / Facebook / Instagram */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Aura" />
        <meta property="og:title" content="Aura - 50:50 성비 맞춤 & 프리미엄 AI 데이팅" />
        <meta property="og:description" content="남녀 50:50 성비 보장, AI 사진 보정과 맞춤 매칭부터 데이트 코스까지. 지금 바로 시작하세요." />
        <meta property="og:url" content="https://aura-ai-dating.vercel.app" />
        <meta property="og:image" content="https://aura-ai-dating.vercel.app/og-image.png" />
        <meta property="og:image:secure_url" content="https://aura-ai-dating.vercel.app/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Aura - 50:50 성비 맞춤 & 프리미엄 AI 데이팅" />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Aura" />
        <meta name="twitter:title" content="Aura - 50:50 성비 맞춤 & 프리미엄 AI 데이팅" />
        <meta name="twitter:description" content="남녀 50:50 성비 보장, AI 사진 보정과 맞춤 매칭부터 데이트 코스까지. 지금 바로 시작하세요." />
        <meta name="twitter:image" content="https://aura-ai-dating.vercel.app/og-image.png" />

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
