'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { MEMBER_ONLY_EVENT, type MemberOnlyGateDetail } from '@/lib/member-only-gate';

export default function MemberOnlyDialogHost() {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<MemberOnlyGateDetail>).detail;
      setFeature(detail?.feature);
      setOpen(true);
    };

    window.addEventListener(MEMBER_ONLY_EVENT, handler);
    return () => window.removeEventListener(MEMBER_ONLY_EVENT, handler);
  }, []);

  const handleSignup = () => {
    setOpen(false);
    router.push('/signup');
  };

  const featureLabel = feature
    ? (feature.startsWith('feature_') ? t(feature as any) : feature)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm bg-zinc-950/95 border-amber-500/40 text-white p-6 shadow-2xl backdrop-blur-2xl rounded-3xl text-center">
        <DialogHeader className="items-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(229,169,52,0.3)]">
            <Crown className="w-7 h-7 text-amber-400" />
          </div>
          <DialogTitle className="text-lg font-extrabold text-white">
            {t('member_only_title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-300 mt-2 leading-relaxed">
            {featureLabel
              ? t('member_only_feature_desc').replace('%s', featureLabel)
              : t('member_only_general_desc')}
            <br />
            {t('member_only_signup_prompt')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="flex-1 h-11 rounded-full text-sm font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          >
            {t('member_only_keep_browsing')}
          </Button>
          <Button
            onClick={handleSignup}
            className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-extrabold text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {t('member_only_signup_btn')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
