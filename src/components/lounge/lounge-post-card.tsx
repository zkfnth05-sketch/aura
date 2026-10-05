'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoungePost } from '@/lib/lounge-types';
import { LoungeStore } from '@/lib/lounge-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Sparkles, 
  Share2, 
  MapPin, 
  Crown, 
  MessageSquareHeart,
  Check,
  X,
  VenetianMask as Mask,
  Lock,
  Globe,
  Loader2,
  Trash2
} from 'lucide-react';
import { ANONYMOUS_AVATAR } from '@/lib/lounge-types';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { getLoungeTranslationAction } from '@/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function LoungePostCard({
  post,
  onUpdated,
}: {
  post: LoungePost;
  onUpdated?: () => void;
}) {
  const router = useRouter();
  const { user } = useUser();
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);

  // Multilingual auto-translation states
  const [showOriginal, setShowOriginal] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<string | null>(
    language !== 'ko' ? (post.translations?.[language] || null) : null
  );

  // Sync translation when language changes or if translation is missing
  useEffect(() => {
    if (language === 'ko') {
      setCurrentTranslation(null);
      return;
    }

    if (post.translations?.[language]) {
      setCurrentTranslation(post.translations[language]);
      return;
    }

    // Auto-fetch missing translation via Gemini AI
    let isMounted = true;
    const fetchTranslation = async () => {
      setIsTranslating(true);
      try {
        const res = await getLoungeTranslationAction(post.content);
        if (isMounted && res && res[language]) {
          setCurrentTranslation(res[language]);
          LoungeStore.updatePostTranslations(post.id, {
            en: res.en || post.content,
            ja: res.ja || post.content,
            es: res.es || post.content,
          });
        }
      } catch (e) {
        console.warn('Lounge post translation error:', e);
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    };

    fetchTranslation();
    return () => {
      isMounted = false;
    };
  }, [post.id, post.content, post.translations, language]);

  // Translate discussion prompt when language changes
  const [currentPromptTranslation, setCurrentPromptTranslation] = useState<string | null>(null);
  useEffect(() => {
    if (language === 'ko' || !post.discussionPrompt) {
      setCurrentPromptTranslation(null);
      return;
    }

    const cachedKey = `discussion_prompt_${language}`;
    if (post.translations?.[cachedKey]) {
      setCurrentPromptTranslation(post.translations[cachedKey]);
      return;
    }

    let isMounted = true;
    getLoungeTranslationAction(post.discussionPrompt).then((res) => {
      if (isMounted && res && res[language]) {
        setCurrentPromptTranslation(res[language]);
        LoungeStore.updatePostTranslations(post.id, {
          [cachedKey]: res[language],
        });
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [post.id, post.discussionPrompt, post.translations, language]);

  const isOfficialMagazine = post.userId === 'aura-official-editor' || post.userName?.includes('Aura') || post.userName?.includes('매거진') || post.userName?.includes('공식');
  const cardAvatar = isOfficialMagazine
    ? '/aura-magazine-logo.jpg'
    : post.userAvatar;

  // DM / Profile Dialog states
  const [isDmDialogOpen, setIsDmDialogOpen] = useState(false);
  const [dmMessage, setDmMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete =
    isOfficialMagazine ||
    (user?.id && user.id === post.userId) ||
    (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuthenticated') === 'true');

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await LoungeStore.deletePost(post.id);
      toast({
        title: t('lounge_post_deleted_title'),
        description: t('lounge_post_deleted_desc'),
      });
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error('Failed to delete post:', e);
      toast({
        variant: 'destructive',
        title: t('lounge_delete_fail_title'),
        description: t('lounge_delete_fail_desc'),
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleLike = () => {
    const nextState = LoungeStore.toggleLike(post.id, user?.id);
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    if (onUpdated) onUpdated();
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);

    const newComment = LoungeStore.addComment({
      postId: post.id,
      userId: user?.id || 'guest',
      userName: isCommentAnonymous ? '익명의 오라' : (user?.name || '나'),
      userAvatar: isCommentAnonymous
        ? ANONYMOUS_AVATAR
        : (user?.photoUrls?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'),
      userGender: (user?.gender as any) || '여성',
      content: commentText.trim(),
    });

    if (newComment) {
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      toast({
        title: isCommentAnonymous ? t('lounge_comment_anon_title') : t('lounge_comment_normal_title'),
        description: isCommentAnonymous
          ? t('lounge_comment_anon_desc')
          : t('lounge_comment_normal_desc'),
      });
      if (onUpdated) onUpdated();
    }
    setIsSubmittingComment(false);
  };

  const handleSendDirectMessage = async () => {
    if (!dmMessage.trim()) {
      toast({
        variant: 'destructive',
        description: t('lounge_dm_message_required'),
      });
      return;
    }

    const currentUserId = user?.id;
    const targetUserId = post.userId;

    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      const matchId = [currentUserId, targetUserId].sort().join('_');
      const now = new Date().toISOString();
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        if (supabase) {
          await supabase.from('matches').upsert({
            id: matchId,
            users: [currentUserId, targetUserId],
            last_message: dmMessage.trim(),
            last_message_timestamp: now,
            last_message_sender_id: currentUserId,
            unread_counts: { [currentUserId]: 0, [targetUserId]: 1 },
            call_status: 'idle',
            caller_id: null,
            match_date: now,
          }, { onConflict: 'id' });

          await supabase.from('messages').insert({
            match_id: matchId,
            sender_id: currentUserId,
            content: `[${post.isAnonymous ? '익명 고민 인용' : '스레드 인용'}: "${post.content.slice(0, 30)}..."]\n${dmMessage.trim()}`,
            created_at: now,
          });
        }
      } catch (err) {
        console.warn('Failed to upsert match message:', err);
      }
    }

    toast({
      title: post.isAnonymous ? t('lounge_dm_sent_anon_title') : t('lounge_dm_sent_title').replace('%s', post.userName),
      description: t('lounge_dm_sent_desc'),
    });

    setIsDmDialogOpen(false);
    setDmMessage('');

    setTimeout(() => {
      if (currentUserId && targetUserId) {
        const matchId = [currentUserId, targetUserId].sort().join('_');
        router.push(`/chat/${matchId}`);
      } else {
        router.push('/matches');
      }
    }, 500);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('lounge_link_copied_title'),
        description: t('lounge_link_copied_desc'),
      });
    }
  };

  return (
    <>
      <article
        className={`w-full bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border ${
          post.isAnonymous
            ? 'border-purple-500/40 hover:border-purple-400/60 shadow-[0_4px_24px_rgba(168,85,247,0.1)]'
            : 'border-zinc-800/80 hover:border-amber-500/30 shadow-xl'
        } rounded-3xl p-5 mb-4 backdrop-blur-md transition-all`}
      >
        {/* Top Header: Author Info */}
        <div className="flex items-center justify-between mb-3.5">
          <div 
            onClick={() => setIsDmDialogOpen(true)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <Avatar
                className={`w-11 h-11 border-2 ${
                  isOfficialMagazine
                    ? 'border-amber-400 shadow-[0_0_12px_rgba(229,169,52,0.4)]'
                    : post.isAnonymous
                    ? 'border-purple-500/50 group-hover:border-purple-400'
                    : 'border-amber-500/40 group-hover:border-amber-400'
                } shadow-md transition-all group-hover:scale-105`}
              >
                <AvatarImage src={cardAvatar} alt={post.userName} className="object-cover" />
                <AvatarFallback className="bg-zinc-800 text-amber-300 font-bold">
                  {isOfficialMagazine ? 'Aura' : (post.isAnonymous ? '?' : (post.userName?.[0] || 'U'))}
                </AvatarFallback>
              </Avatar>
              {post.isVip && !post.isAnonymous && (
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-0.5 rounded-full ring-2 ring-zinc-900">
                  <Crown className="w-2.5 h-2.5 fill-black" />
                </span>
              )}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold text-sm transition-colors ${
                    post.isAnonymous ? 'text-purple-300 group-hover:text-purple-200' : 'text-white group-hover:text-amber-300'
                  }`}
                >
                  {post.userName}
                </span>
                {post.isAnonymous ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Mask className="w-3 h-3 text-purple-400" />
                    {t('lounge_card_anonymous_badge')}
                  </span>
                ) : (
                  <>
                    {post.userAge && (
                      <span className="text-xs text-zinc-400 font-normal">
                        · {post.userAge}
                      </span>
                    )}
                    {post.userGender && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        post.userGender === '여성' ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {post.userGender}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                {post.isAnonymous ? (
                  <span className="flex items-center gap-1 text-purple-400/80">
                    <Lock className="w-3 h-3" />
                    {t('lounge_card_anonymous_hint')}
                  </span>
                ) : (
                  post.userLocation && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      {post.userLocation}
                    </span>
                  )
                )}
                <span>· {post.createdAt}</span>
              </div>
            </div>
          </div>

          {/* DM Quick Button & Delete Button */}
          <div className="flex items-center gap-1.5">
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="h-8 w-8 p-0 rounded-full text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title={t('lounge_delete_title')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDmDialogOpen(true)}
              className={`h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                post.isAnonymous
                  ? 'border-purple-500/40 hover:border-purple-400 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200'
                  : 'border-amber-500/40 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200'
              }`}
            >
              <MessageSquareHeart className={`w-3.5 h-3.5 ${post.isAnonymous ? 'text-purple-400' : 'text-amber-400'}`} />
              <span>{post.isAnonymous ? t('lounge_card_secret_note') : t('lounge_card_direct_message')}</span>
            </Button>
          </div>
        </div>

        {/* Content Body with Automatic Multilingual Translation */}
        <div className="text-left mb-3.5">
          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-line break-words">
            {language !== 'ko' && !showOriginal
              ? (currentTranslation || post.translations?.[language] || post.content)
              : post.content}
          </p>

          {/* Multilingual Translation Status & Show Original Toggle */}
          {language !== 'ko' && (
            <div className="mt-2.5 flex items-center justify-between py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                {isTranslating ? (
                  <span className="flex items-center gap-1.5 text-amber-400/80">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                    {t('lounge_ai_translating')}
                  </span>
                ) : (
                  <span className="font-medium text-[11px] sm:text-xs">
                    {language === 'en'
                      ? 'Translated by Gemini AI (EN)'
                      : language === 'ja'
                      ? 'Gemini AI 翻訳 (JA)'
                      : 'Traducido por Gemini AI (ES)'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="text-amber-400 hover:text-amber-200 underline font-semibold transition-colors cursor-pointer text-[11px]"
              >
                {showOriginal
                  ? (language === 'en' ? 'Show Translation' : language === 'ja' ? '翻訳を表示' : 'Ver traducción')
                  : (language === 'en' ? 'Show Original (Korean)' : language === 'ja' ? '原文（韓国語）を見る' : 'Ver original (Coreano)')}
              </button>
            </div>
          )}
        </div>

        {/* Attached Photos */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="mb-3.5">
            <div className="rounded-2xl overflow-hidden border border-zinc-800/80 max-h-96 relative group cursor-pointer">
              <img
                src={post.imageUrls[0]}
                alt="Post attachment"
                onClick={() => setSelectedPhoto(post.imageUrls![0])}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          </div>
        )}

        {/* 💬 Discussion Prompt Box (댓글 유도 티키타카 질문 박스) */}
        {post.discussionPrompt && (
          <div className="mb-3.5 p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-zinc-900 border border-rose-500/30 text-xs sm:text-sm shadow-lg text-left">
            <div className="flex items-center gap-2 mb-1.5 text-rose-300 font-bold">
              <span className="text-base">💬</span>
              <span>{t('lounge_discussion_box_title')}</span>
            </div>
            <p className="text-zinc-200 leading-relaxed font-medium pl-6">
              {language !== 'ko'
                ? (currentPromptTranslation || post.translations?.[`discussion_prompt_${language}`] || post.discussionPrompt)
                : post.discussionPrompt}
            </p>
          </div>
        )}

        {/* Hashtags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3.5 text-left">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Interaction Action Bar */}
        <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/60">
          <div className="flex items-center gap-4">
            {/* Gold Heart Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                isLiked
                  ? 'text-amber-400 scale-110'
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  isLiked ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
              <span>{likesCount}</span>
            </button>

            {/* Comment Toggle Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length}</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[11px] text-zinc-500 font-medium">
            AURA Lounge Verified
          </span>
        </div>

        {/* Expandable Comments Section */}
        {showComments && (
          <div className="mt-4 pt-3.5 border-t border-zinc-800/70 space-y-3 text-left">
            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/60">
                    <Avatar className="w-7 h-7 border border-zinc-800 flex-shrink-0">
                      <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                      <AvatarFallback className="text-[10px] bg-zinc-800 text-amber-300">
                        {comment.userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-200">
                          {comment.userName}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {comment.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5 break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-3">
                {t('lounge_card_first_comment')}
              </p>
            )}

            {/* New Comment Input */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  placeholder={
                    isCommentAnonymous
                      ? t('lounge_card_comment_placeholder_anon')
                      : t('lounge_card_comment_placeholder_normal')
                  }
                  className={`flex-1 h-9 px-3.5 rounded-full bg-zinc-900 border ${
                    isCommentAnonymous ? 'border-purple-500/50' : 'border-zinc-800'
                  } text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50`}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !commentText.trim()}
                  className={`h-9 px-3.5 rounded-full font-bold text-xs ${
                    isCommentAnonymous
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-black'
                  }`}
                >
                  {t('lounge_card_comment_submit')}
                </Button>
              </div>

              {/* Anonymous Comment Toggle */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setIsCommentAnonymous(!isCommentAnonymous)}
                  className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                    isCommentAnonymous ? 'text-purple-400 font-bold' : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  <Mask className="w-3.5 h-3.5" />
                  <span>{isCommentAnonymous ? t('lounge_card_comment_anon_on') : t('lounge_card_comment_anon_toggle')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* 1:1 DM Dialog (Direct Message quoting this post) */}
      <Dialog open={isDmDialogOpen} onOpenChange={setIsDmDialogOpen}>
        <DialogContent className={`sm:max-w-md bg-zinc-950 border ${post.isAnonymous ? 'border-purple-500/50' : 'border-amber-500/40'} text-white rounded-3xl p-6 shadow-2xl`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {post.isAnonymous ? (
                <>
                  <Mask className="w-5 h-5 text-purple-400" />
                  <span>{t('lounge_card_dm_dialog_title_anon')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t('lounge_start_dm_with_user').replace('%s', post.userName)}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-left">
            {/* Quoted Post Card */}
            <div className={`p-3.5 rounded-2xl bg-zinc-900/80 border ${post.isAnonymous ? 'border-purple-500/30' : 'border-zinc-800'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar className={`w-6 h-6 border ${post.isAnonymous ? 'border-purple-500/40' : 'border-amber-500/30'}`}>
                  <AvatarImage src={cardAvatar} />
                  <AvatarFallback className="text-[10px]">{isOfficialMagazine ? 'A' : (post.isAnonymous ? '?' : post.userName[0])}</AvatarFallback>
                </Avatar>
                <span className={`text-xs font-bold ${post.isAnonymous ? 'text-purple-300' : 'text-amber-300'}`}>
                  {post.isAnonymous ? t('lounge_card_anonymous_hint') : post.userName}
                </span>
              </div>
              <p className="text-xs text-zinc-300 line-clamp-2 italic">
                "{post.content}"
              </p>
            </div>

            {/* View Full Profile Link (Only for Non-Anonymous) */}
            {!post.isAnonymous && post.userId && post.userId !== 'guest' && (
              <button
                type="button"
                onClick={() => {
                  setIsDmDialogOpen(false);
                  router.push(`/users/${post.userId}`);
                }}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-zinc-300 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>👤</span>
                <span>{t('lounge_view_profile_photo').replace('%s', post.userName)}</span>
              </button>
            )}

            {/* Message Input */}
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                {post.isAnonymous ? t('lounge_card_secret_note') : t('lounge_card_direct_message')}
              </label>
              <textarea
                rows={3}
                value={dmMessage}
                onChange={(e) => setDmMessage(e.target.value)}
                placeholder={
                  post.isAnonymous
                    ? t('lounge_card_comment_placeholder_anon')
                    : t('lounge_card_comment_placeholder_normal')
                }
                className={`w-full bg-zinc-900 border ${
                  post.isAnonymous ? 'border-purple-500/40 focus:border-purple-400' : 'border-zinc-800 focus:border-amber-500/50'
                } rounded-2xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsDmDialogOpen(false)}
                className="flex-1 rounded-full text-zinc-400 hover:text-white"
              >
                {t('lounge_card_cancel')}
              </Button>
              <Button
                onClick={handleSendDirectMessage}
                disabled={!dmMessage.trim()}
                className={`flex-1 rounded-full ${
                  post.isAnonymous
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-purple-500/20'
                    : 'bg-gradient-to-r from-[#E5A934] to-[#C98718] hover:from-[#F0B746] hover:to-[#D49425] text-black font-extrabold shadow-lg shadow-amber-500/20'
                }`}
              >
                {post.isAnonymous ? t('lounge_card_dm_send_anon') : t('lounge_card_dm_send_normal')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox for Photos */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="Full size view"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-amber-500/20"
          />
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm rounded-2xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-bold text-zinc-100">
              {t('lounge_delete_title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-400">
              {t('lounge_delete_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs"
            >
              {t('lounge_delete_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              {isDeleting ? '...' : t('lounge_delete_btn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
