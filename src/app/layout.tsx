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
        <title>Aura AI Dating - 50:50 Ratio Korean Dating &amp; Language Exchange</title>
        <meta name="description" content="Meet verified Korean friends and singles with real-time AI auto-translation chat and voice subtitles. 50:50 gender ratio, no Korean phone number required." />
        <meta name="keywords" content="Aura AI Dating, Aura Dating Korea, 아우라AI데이팅, Korean Language Exchange, Korean Dating" />
        
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
        <meta property="og:title" content="Aura AI Dating - 50:50 Ratio Korean Dating &amp; Language Exchange" />
        <meta property="og:description" content="Meet verified Korean friends and singles with real-time AI auto-translation chat and voice subtitles. 50:50 gender ratio, no Korean phone number required." />
        <meta property="og:url" content="https://aura-ai-dating.vercel.app" />
        <meta property="og:image" content="https://aura-ai-dating.vercel.app/og-image.png" />
        <meta property="og:image:secure_url" content="https://aura-ai-dating.vercel.app/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Aura AI Dating - 50:50 Ratio Korean Dating &amp; Language Exchange" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Aura" />
        <meta name="twitter:title" content="Aura AI Dating - 50:50 Ratio Korean Dating &amp; Language Exchange" />
        <meta name="twitter:description" content="Meet verified Korean friends and singles with real-time AI auto-translation chat and voice subtitles. 50:50 gender ratio, no Korean phone number required." />
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
              "description": "Meet verified Korean friends and singles with real-time AI auto-translation chat and voice subtitles. 50:50 gender ratio, no Korean phone number required.",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
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
