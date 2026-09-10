'use client';

import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { ANONYMOUS_AVATAR } from '@/lib/lounge-types';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function LoungePostCard({
  post,
  onUpdated,
}: {
  post: LoungePost;
  onUpdated?: () => void;
}) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);

  // DM / Profile Dialog states
  const [isDmDialogOpen, setIsDmDialogOpen] = useState(false);
  const [dmMessage, setDmMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleLike = () => {
    const nextState = LoungeStore.toggleLike(post.id);
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
        title: isCommentAnonymous ? '🎭 익명 댓글 등록' : '댓글 등록',
        description: isCommentAnonymous
          ? '프로필이 안전하게 보호된 채로 공감 댓글이 등록되었습니다.'
          : '소중한 의견이 등록되었습니다.',
      });
      if (onUpdated) onUpdated();
    }
    setIsSubmittingComment(false);
  };

  const handleSendDirectMessage = async () => {
    if (!dmMessage.trim()) {
      toast({
        variant: 'destructive',
        description: '보내실 메시지를 입력해 주세요.',
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
      title: post.isAnonymous ? '💌 익명 작성자에게 비밀 쪽지 전송 완료' : `💌 ${post.userName}님께 메시지 전송 완료`,
      description: '회원님의 메시지가 상대방의 대화창으로 발송되었습니다!',
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
        title: '링크 복사 완료',
        description: '스레드 링크가 클립보드에 복사되었습니다.',
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
                  post.isAnonymous
                    ? 'border-purple-500/50 group-hover:border-purple-400'
                    : 'border-amber-500/40 group-hover:border-amber-400'
                } shadow-md transition-all group-hover:scale-105`}
              >
                <AvatarImage src={post.userAvatar} alt={post.userName} className="object-cover" />
                <AvatarFallback className="bg-zinc-800 text-amber-300 font-bold">
                  {post.isAnonymous ? '?' : (post.userName?.[0] || 'U')}
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
                    익명 고민
                  </span>
                ) : (
                  <>
                    {post.userAge && (
                      <span className="text-xs text-zinc-400 font-normal">
                        · {post.userAge}세
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
                    완벽 비밀보장 속마음
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

          {/* DM Quick Button */}
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
            <span>{post.isAnonymous ? '비밀쪽지' : '대화하기'}</span>
          </Button>
        </div>

        {/* Content Body */}
        <div className="text-left mb-3.5">
          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-line break-words">
            {post.content}
          </p>
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
              <p className="text-xs text-zinc-500 py-1 text-center">
                첫 번째 댓글의 주인공이 되어보세요!
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
                      ? '익명으로 따뜻한 위로와 조언을 남겨보세요...'
                      : '따뜻한 공감 댓글을 남겨보세요...'
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
                  등록
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
                  <span>{isCommentAnonymous ? '🎭 익명 댓글 모드 ON (프로필 숨김)' : '익명으로 댓글 작성하기'}</span>
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
                  <span>익명 작성자에게 비밀 쪽지 보내기</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{post.userName}님과 1:1 대화 시작하기</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-left">
            {/* Quoted Post Card */}
            <div className={`p-3.5 rounded-2xl bg-zinc-900/80 border ${post.isAnonymous ? 'border-purple-500/30' : 'border-zinc-800'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar className={`w-6 h-6 border ${post.isAnonymous ? 'border-purple-500/40' : 'border-amber-500/30'}`}>
                  <AvatarImage src={post.userAvatar} />
                  <AvatarFallback className="text-[10px]">{post.isAnonymous ? '?' : post.userName[0]}</AvatarFallback>
                </Avatar>
                <span className={`text-xs font-bold ${post.isAnonymous ? 'text-purple-300' : 'text-amber-300'}`}>
                  {post.isAnonymous ? '익명 회원의 속마음 고민' : `${post.userName}님의 스레드 글`}
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
                <span>{post.userName}님의 상세 프로필 및 사진 보기</span>
              </button>
            )}

            {/* Message Input */}
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                {post.isAnonymous ? '비밀 쪽지 내용:' : '첫 메시지 작성:'}
              </label>
              <textarea
                rows={3}
                value={dmMessage}
                onChange={(e) => setDmMessage(e.target.value)}
                placeholder={
                  post.isAnonymous
                    ? '고민에 공감하고 위로가 되는 따뜻한 비밀 쪽지를 보내보세요. 안전하게 전달됩니다.'
                    : `${post.userName}님의 일상에 공감하며 자연스럽게 대화를 시작해보세요!`
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
                취소
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
                {post.isAnonymous ? '비밀 쪽지 전송 💌' : '메시지 전송 🚀'}
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
    </>
  );
}
