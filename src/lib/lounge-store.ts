'use client';

import { LoungePost, LoungeComment, INITIAL_LOUNGE_POSTS, ANONYMOUS_AVATAR } from './lounge-types';
import { supabase } from './supabaseClient';
import { getLoungeTranslationAction } from '@/actions/ai-actions';

const STORAGE_KEY = 'aura_lounge_posts_v4';

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '방금 전';
  // If it's already a relative format like '15분 전' or '방금 전'
  if (dateStr.includes('전') || dateStr.includes('방금')) {
    return dateStr;
  }

  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return '방금 전';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}일 전`;
    return `${Math.floor(diffDays / 30)}달 전`;
  } catch {
    return '방금 전';
  }
}

export class LoungeStore {
  /**
   * Synchronously return cached posts for instantaneous 0ms page rendering.
   */
  public static getPosts(): LoungePost[] {
    if (typeof window === 'undefined') {
      return INITIAL_LOUNGE_POSTS;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load lounge posts from storage:', e);
    }

    // Default initialize with real database virtual member posts
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOUNGE_POSTS));
    } catch {}
    return INITIAL_LOUNGE_POSTS;
  }

  /**
   * Fetch all posts from Supabase database including nested comments and user likes.
   */
  public static async fetchPostsFromSupabase(currentUserId?: string): Promise<LoungePost[]> {
    if (typeof window === 'undefined' || !supabase) {
      return this.getPosts();
    }

    try {
      // 1. Fetch posts and their comments joined
      const { data: dbPosts, error } = await supabase
        .from('lounge_posts')
        .select(`
          *,
          lounge_comments (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch lounge_posts from Supabase:', error);
        return this.getPosts();
      }

      if (!dbPosts || dbPosts.length === 0) {
        return this.getPosts();
      }

      // 2. Fetch current user's liked posts if user is logged in
      const likedPostIds = new Set<string>();
      if (currentUserId) {
        try {
          const { data: userLikes } = await supabase
            .from('lounge_likes')
            .select('post_id')
            .eq('user_id', currentUserId);

          if (userLikes) {
            userLikes.forEach((l) => likedPostIds.add(l.post_id));
          }
        } catch (e) {
          console.warn('Failed to fetch user likes:', e);
        }
      }

      // 3. Map DB schema to LoungePost[]
      const mappedPosts: LoungePost[] = dbPosts.map((p: any) => {
        const rawComments = Array.isArray(p.lounge_comments) ? p.lounge_comments : [];
        const mappedComments: LoungeComment[] = rawComments.map((c: any) => ({
          id: c.id,
          postId: c.post_id,
          userId: c.user_id,
          userName: c.user_name,
          userAvatar: c.user_avatar,
          userGender: c.user_gender || undefined,
          content: c.content,
          createdAt: formatTimeAgo(c.created_at),
          isAnonymous: Boolean(c.is_anonymous),
          anonymousAlias: c.anonymous_alias || undefined,
          translations: c.translations || {},
        }));

        // Sort comments by created_at ascending
        mappedComments.sort((a, b) => a.id.localeCompare(b.id));

        return {
          id: p.id,
          userId: p.user_id,
          userName: p.user_name,
          userAvatar: p.user_avatar,
          userAge: p.user_age ?? undefined,
          userGender: p.user_gender ?? undefined,
          userLocation: p.user_location ?? undefined,
          content: p.content,
          imageUrls: Array.isArray(p.image_urls) ? p.image_urls : [],
          tags: Array.isArray(p.tags) ? p.tags : [],
          likesCount: p.likes_count ?? 0,
          isLiked: likedPostIds.has(p.id),
          commentsCount: p.comments_count ?? mappedComments.length,
          comments: mappedComments,
          createdAt: formatTimeAgo(p.created_at),
          isVip: Boolean(p.is_vip),
          auraScore: p.aura_score ?? 90,
          isAnonymous: Boolean(p.is_anonymous),
          anonymousAlias: p.anonymous_alias ?? undefined,
          translations: p.translations || {},
        };
      });

      this.savePosts(mappedPosts);
      return mappedPosts;
    } catch (err) {
      console.warn('Lounge Supabase fetch exception:', err);
      return this.getPosts();
    }
  }

  /**
   * Sync and hydrate lounge posts from Supabase.
   */
  public static async syncWithRealMembers(currentUserId?: string): Promise<LoungePost[]> {
    return this.fetchPostsFromSupabase(currentUserId);
  }

  public static savePosts(posts: LoungePost[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      // Dispatch custom event for cross-component reactivity
      window.dispatchEvent(new CustomEvent('aura_lounge_updated'));
    } catch (e) {
      console.error('Failed to save lounge posts:', e);
    }
  }

  /**
   * Create a new post: saves to Supabase DB and translates via Gemini AI simultaneously.
   */
  public static async createPost({
    userId,
    userName,
    userAvatar,
    userAge,
    userGender,
    userLocation,
    content,
    imageUrls,
    tags,
    isAnonymous,
    anonymousAlias,
  }: {
    userId: string;
    userName: string;
    userAvatar: string;
    userAge?: number;
    userGender?: '남성' | '여성' | '기타';
    userLocation?: string;
    content: string;
    imageUrls?: string[];
    tags?: string[];
    isAnonymous?: boolean;
    anonymousAlias?: string;
  }): Promise<LoungePost> {
    const finalUserName = isAnonymous ? '익명의 오라' : userName;
    const finalAvatar = isAnonymous
      ? ANONYMOUS_AVATAR
      : (userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
    const finalLocation = isAnonymous ? '비밀 공간' : (userLocation || '서울');
    const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newPost: LoungePost = {
      id: postId,
      userId: isAnonymous ? `anon-${Date.now()}` : userId,
      userName: finalUserName,
      userAvatar: finalAvatar,
      userAge: isAnonymous ? undefined : (userAge || 26),
      userGender: isAnonymous ? undefined : (userGender || '여성'),
      userLocation: finalLocation,
      content,
      imageUrls: imageUrls || [],
      tags: tags || ['일상'],
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
      createdAt: '방금 전',
      isVip: true,
      auraScore: 95,
      isAnonymous: Boolean(isAnonymous),
      anonymousAlias: anonymousAlias || (isAnonymous ? '익명회원' : undefined),
      translations: {},
    };

    // 1. Optimistic UI update: show immediately on client
    const currentPosts = this.getPosts();
    const updated = [newPost, ...currentPosts];
    this.savePosts(updated);

    // 2. Translate asynchronously via Gemini AI in background & persist to Supabase
    (async () => {
      try {
        let translations: Record<string, string> = {};
        try {
          const aiTranslations = await getLoungeTranslationAction(content);
          if (aiTranslations) {
            translations = {
              en: aiTranslations.en || content,
              ja: aiTranslations.ja || content,
              es: aiTranslations.es || content,
            };
          }
        } catch (tErr) {
          console.warn('Gemini translation error during post creation:', tErr);
        }

        // Insert into Supabase lounge_posts table
        if (supabase) {
          const { error: insertError } = await supabase.from('lounge_posts').insert({
            id: postId,
            user_id: newPost.userId,
            user_name: newPost.userName,
            user_avatar: newPost.userAvatar,
            user_age: newPost.userAge || null,
            user_gender: newPost.userGender || null,
            user_location: newPost.userLocation || null,
            content: newPost.content,
            image_urls: newPost.imageUrls || [],
            tags: newPost.tags || [],
            likes_count: 0,
            comments_count: 0,
            is_vip: true,
            aura_score: 95,
            is_anonymous: Boolean(isAnonymous),
            anonymous_alias: newPost.anonymousAlias || null,
            translations: translations,
            created_at: nowIso,
            updated_at: nowIso,
          });

          if (insertError) {
            console.error('Failed to insert post into Supabase:', insertError);
          }
        }

        // Update local post with translations
        if (Object.keys(translations).length > 0) {
          const latestPosts = this.getPosts();
          const target = latestPosts.find((p) => p.id === postId);
          if (target) {
            target.translations = translations;
            this.savePosts(latestPosts);
          }
        }
      } catch (err) {
        console.error('Async post persistence error:', err);
      }
    })();

    return newPost;
  }

  /**
   * Toggle like state for a post: updates local UI instantly and syncs to Supabase.
   */
  public static toggleLike(postId: string, currentUserId?: string): boolean {
    const posts = this.getPosts();
    const target = posts.find((p) => p.id === postId);
    if (!target) return false;

    target.isLiked = !target.isLiked;
    target.likesCount = target.isLiked ? target.likesCount + 1 : Math.max(0, target.likesCount - 1);
    this.savePosts(posts);

    const isLikedNow = target.isLiked;
    const newLikesCount = target.likesCount;

    // Sync with Supabase in background
    if (supabase && currentUserId) {
      (async () => {
        try {
          if (isLikedNow) {
            await supabase.from('lounge_likes').upsert(
              {
                id: `${postId}_${currentUserId}`,
                post_id: postId,
                user_id: currentUserId,
              },
              { onConflict: 'post_id,user_id' }
            );
          } else {
            await supabase
              .from('lounge_likes')
              .delete()
              .match({ post_id: postId, user_id: currentUserId });
          }

          // Update likes_count in lounge_posts
          await supabase
            .from('lounge_posts')
            .update({ likes_count: newLikesCount })
            .eq('id', postId);
        } catch (err) {
          console.warn('Failed to sync like with Supabase:', err);
        }
      })();
    }

    return isLikedNow;
  }

  /**
   * Add a comment to a post: updates local UI instantly and syncs to Supabase.
   */
  public static addComment({
    postId,
    userId,
    userName,
    userAvatar,
    userGender,
    content,
    isAnonymous,
    anonymousAlias,
  }: {
    postId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    userGender?: '남성' | '여성' | '기타';
    content: string;
    isAnonymous?: boolean;
    anonymousAlias?: string;
  }): LoungeComment | null {
    const posts = this.getPosts();
    const target = posts.find((p) => p.id === postId);
    if (!target) return null;

    const finalName = isAnonymous
      ? (anonymousAlias || `익명 조언러 ${(target.comments?.length || 0) + 1}`)
      : userName;
    const finalAvatar = isAnonymous
      ? ANONYMOUS_AVATAR
      : (userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80');
    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newComment: LoungeComment = {
      id: commentId,
      postId,
      userId: isAnonymous ? `anon-${Date.now()}` : userId,
      userName: finalName,
      userAvatar: finalAvatar,
      userGender: isAnonymous ? undefined : userGender,
      content,
      createdAt: '방금 전',
      isAnonymous: Boolean(isAnonymous),
      anonymousAlias: finalName,
      translations: {},
    };

    if (!target.comments) target.comments = [];
    target.comments.push(newComment);
    target.commentsCount = target.comments.length;
    this.savePosts(posts);

    // Sync to Supabase in background
    if (supabase) {
      (async () => {
        try {
          await supabase.from('lounge_comments').insert({
            id: commentId,
            post_id: postId,
            user_id: newComment.userId,
            user_name: newComment.userName,
            user_avatar: newComment.userAvatar,
            user_gender: newComment.userGender || null,
            content: newComment.content,
            is_anonymous: Boolean(isAnonymous),
            anonymous_alias: newComment.anonymousAlias || null,
            created_at: nowIso,
          });

          // Update comments_count in lounge_posts
          await supabase
            .from('lounge_posts')
            .update({ comments_count: target.commentsCount })
            .eq('id', postId);
        } catch (err) {
          console.warn('Failed to insert comment to Supabase:', err);
        }
      })();
    }

    return newComment;
  }

  /**
   * Save on-demand translations back to Supabase and cache.
   */
  public static async updatePostTranslations(
    postId: string,
    translations: Record<string, string>
  ): Promise<void> {
    const posts = this.getPosts();
    const target = posts.find((p) => p.id === postId);
    if (target) {
      target.translations = { ...(target.translations || {}), ...translations };
      this.savePosts(posts);
    }

    if (supabase) {
      try {
        await supabase
          .from('lounge_posts')
          .update({ translations: target?.translations || translations })
          .eq('id', postId);
      } catch (err) {
        console.warn('Failed to update translations in Supabase:', err);
      }
    }
  }
}
