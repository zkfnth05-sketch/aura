'use client';

import { useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { fetchUserProfile, getClient } from '@/lib/supabaseDataService';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

export function NewLikeToast() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!currentUser?.id) return;
    const client = getClient();
    const channel = client
      .channel(`new-like-toast-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `likee_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const row = payload.new as any;
          if (!row || !row.is_like || !row.liker_id) return;
          try {
            const liker = await fetchUserProfile(row.liker_id);
            if (liker) {
              toast({
                duration: 5000,
                title: t('new_like_title'),
                description: (
                  <Link href={`/users/${liker.id}`} className="w-full">
                    <div className="flex items-center gap-3 mt-2 cursor-pointer">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={liker.photoUrls?.[0]} alt={liker.name} />
                        <AvatarFallback>{liker.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{t('new_like_desc').replace('%s', liker.name)}</span>
                    </div>
                  </Link>
                ),
              });
            }
          } catch (e) {
            console.error('Error showing like toast:', e);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [currentUser?.id, toast, t]);

  return null;
}
