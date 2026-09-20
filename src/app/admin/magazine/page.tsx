'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin-layout';
import { LoungeStore } from '@/lib/lounge-store';
import { LoungePost } from '@/lib/lounge-types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  Search,
  Sparkles,
  ShieldCheck,
  Home,
  Loader2,
  Heart,
  MessageCircle,
  Crown,
  AlertTriangle,
  LayoutGrid,
  List,
  Eye,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

const ADMIN_ID = 'admin';
const ADMIN_PASS = 'rlaghddlf0411*';

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === ADMIN_ID && password === ADMIN_PASS) {
      setError('');
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      onLogin();
    } else {
      setError('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-sm border-neutral-800 bg-neutral-900 text-neutral-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            관리자 로그인
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Aura 공식 스레드 관리자 전용 페이지입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="id" className="text-neutral-300">아이디</Label>
              <Input
                id="id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="bg-neutral-950 border-neutral-800"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-neutral-950 border-neutral-800"
                required
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-bold"
            >
              로그인
            </Button>
          </form>
          <Button variant="secondary" asChild className="w-full mt-4 border-neutral-800 bg-neutral-950 hover:bg-neutral-800">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              앱 처음으로 돌아가기
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminMagazineThreadsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [posts, setPosts] = useState<LoungePost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'official' | 'member'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Multi-select for batch delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchDeleteAlertOpen, setIsBatchDeleteAlertOpen] = useState(false);

  // Detail View Dialog state
  const [detailPost, setDetailPost] = useState<LoungePost | null>(null);

  // Edit / Create Dialog states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<LoungePost | null>(null);
  const [formContent, setFormContent] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formTags, setFormTags] = useState('');

  // Delete states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteOfficialOpen, setIsDeleteOfficialOpen] = useState(false);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);

  const { toast } = useToast();

  const loadPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const localPosts = LoungeStore.getPosts();
      setPosts(localPosts);

      // Hydrate from Supabase
      const synced = await LoungeStore.syncWithRealMembers();
      if (synced && synced.length > 0) {
        setPosts(synced);
      }
    } catch (e) {
      console.error('Failed to load posts in admin:', e);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();

      const handleUpdated = () => {
        setPosts(LoungeStore.getPosts());
      };
      window.addEventListener('aura_lounge_updated', handleUpdated);
      return () => {
        window.removeEventListener('aura_lounge_updated', handleUpdated);
      };
    }
  }, [isAuthenticated]);

  const isOfficial = (p: LoungePost) =>
    p.userId === 'aura-official-editor' ||
    p.userName?.includes('Aura') ||
    p.userName?.includes('매거진') ||
    p.userName?.includes('공식');

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const official = isOfficial(p);
      if (filterType === 'official' && !official) return false;
      if (filterType === 'member' && official) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.content.toLowerCase().includes(term) ||
        (p.userName && p.userName.toLowerCase().includes(term)) ||
        (p.discussionPrompt && p.discussionPrompt.toLowerCase().includes(term)) ||
        p.tags?.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [posts, searchTerm, filterType]);

  const stats = useMemo(() => {
    const total = posts.length;
    const officialCount = posts.filter(isOfficial).length;
    const memberCount = total - officialCount;
    const totalComments = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
    return { total, officialCount, memberCount, totalComments };
  }, [posts]);

  // Checkbox toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPosts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPosts.map((p) => p.id));
    }
  };

  // Batch delete selected posts
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchDeleting(true);
    try {
      for (const id of selectedIds) {
        await LoungeStore.deletePost(id);
      }
      toast({
        title: '🗑️ 선택 글 삭제 완료',
        description: `선택하신 ${selectedIds.length}개의 스레드 글이 성공적으로 삭제되었습니다.`,
      });
      setSelectedIds([]);
    } catch (e) {
      console.error('Failed to batch delete posts:', e);
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '선택한 스레드를 삭제하는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsBatchDeleting(false);
      setIsBatchDeleteAlertOpen(false);
      loadPosts();
    }
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormContent('');
    setFormPrompt('');
    setFormTags('#Aura공식, #소개팅카톡, #연애팁');
    setIsEditorOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (p: LoungePost) => {
    setEditingPost(p);
    setFormContent(p.content);
    setFormPrompt(p.discussionPrompt || '');
    setFormTags(p.tags?.join(', ') || '');
    setIsEditorOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    if (editingPost) {
      // Update
      await LoungeStore.updatePost(editingPost.id, {
        content: formContent.trim(),
        discussionPrompt: formPrompt.trim() || undefined,
        tags: parsedTags,
      });
      toast({
        title: '✏️ 스레드 글 수정 완료',
        description: '스레드 내용 및 소통 핑퐁 질문이 정상적으로 수정되었습니다.',
      });
    } else {
      // Create Official Post
      await LoungeStore.createOfficialPost({
        content: formContent.trim(),
        discussionPrompt: formPrompt.trim() || undefined,
        tags: parsedTags,
      });
      toast({
        title: '💖 공식 스레드 등록 완료',
        description: '새로운 공식 스레드가 라운지 피드에 발행되었습니다.',
      });
    }

    setIsEditorOpen(false);
    setEditingPost(null);
    loadPosts();
  };

  // Delete single post
  const handleDeleteSingle = async () => {
    if (!deletingId) return;
    await LoungeStore.deletePost(deletingId);
    toast({
      title: '🗑️ 스레드 삭제 완료',
      description: '해당 스레드 글이 성공적으로 삭제되었습니다.',
    });
    setDeletingId(null);
    setSelectedIds((prev) => prev.filter((i) => i !== deletingId));
    loadPosts();
  };

  // Delete all official posts
  const handleDeleteOfficial = async () => {
    await LoungeStore.deleteOfficialPosts();
    toast({
      title: '💖 공식 스레드 전체 삭제 완료',
      description: '공식 매거진/에디터 명의의 스레드 글들이 모두 삭제되었습니다.',
    });
    setIsDeleteOfficialOpen(false);
    setSelectedIds([]);
    loadPosts();
  };

  // Clear all posts
  const handleClearAll = async () => {
    await LoungeStore.clearAllPosts();
    toast({
      title: '🚨 모든 스레드 글 초기화 완료',
      description: '라운지 피드의 모든 스레드 글이 완전히 삭제되었습니다.',
    });
    setIsClearAllOpen(false);
    setSelectedIds([]);
    loadPosts();
  };

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 text-left">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                💖
              </span>
              <span>공식 스레드</span>
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Aura 라운지 피드에 게시된 스레드 글을 게시판 형태로 조회하고 자유롭게 수정 및 삭제합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsBatchDeleteAlertOpen(true)}
                className="text-xs font-bold shadow-md shadow-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                선택 글 {selectedIds.length}개 일괄 삭제
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setIsDeleteOfficialOpen(true)}
              className="border-rose-900/50 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              공식 스레드만 전체 삭제
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsClearAllOpen(true)}
              className="border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              전체 스레드 초기화
            </Button>

            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-extrabold text-xs shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              새 공식 스레드 작성
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-neutral-400">총 스레드 글</CardTitle>
              <MessageSquare className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-300">{stats.total}개</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-neutral-400">💖 공식 스레드</CardTitle>
              <Sparkles className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-300">{stats.officialCount}개</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-neutral-400">일반 회원 스레드</CardTitle>
              <MessageCircle className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-cyan-300">{stats.memberCount}개</div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-neutral-400">총 댓글 수</CardTitle>
              <Heart className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-pink-300">{stats.totalComments}개</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & View Mode Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="스레드 본문, 작성자, 소통 핑퐁 질문, 해시태그 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-neutral-900 border-neutral-800 text-neutral-100 text-sm"
            />
          </div>

          {/* Filter Chips & View Mode Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                전체 ({posts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('official')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  filterType === 'official'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                💖 공식 ({stats.officialCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('member')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  filterType === 'member'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                👤 일반 ({stats.memberCount})
              </button>
            </div>

            {/* View Mode Toggle (Table vs Cards) */}
            <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-black'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="게시판(표) 형태 보기"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'cards'
                    ? 'bg-amber-500 text-black'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="카드 형태 보기"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area: Bulletin Board (Table) or Cards */}
        {isLoadingPosts ? (
          <div className="p-12 text-center bg-neutral-900/40 rounded-2xl border border-neutral-800">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">스레드 목록을 불러오는 중입니다...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center bg-neutral-900/40 rounded-2xl border border-neutral-800">
            <MessageSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-neutral-400">조회된 스레드 글이 없습니다.</p>
            <p className="text-xs text-neutral-500 mt-1">상단의 '새 공식 스레드 작성' 버튼을 눌러 새 글을 등록해 보세요.</p>
          </div>
        ) : viewMode === 'table' ? (
          /* ========================================================================= */
          /* 📋 Bulletin Board (Table) View                                            */
          /* ========================================================================= */
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-950/80 border-b border-neutral-800">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40px] text-center">
                      <Checkbox
                        checked={
                          filteredPosts.length > 0 &&
                          selectedIds.length === filteredPosts.length
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="전체 선택"
                      />
                    </TableHead>
                    <TableHead className="w-[50px] text-center text-xs font-bold text-neutral-400">No.</TableHead>
                    <TableHead className="w-[100px] text-xs font-bold text-neutral-400">구분</TableHead>
                    <TableHead className="w-[160px] text-xs font-bold text-neutral-400">작성자</TableHead>
                    <TableHead className="min-w-[280px] text-xs font-bold text-neutral-400">스레드 본문 요약</TableHead>
                    <TableHead className="w-[160px] text-xs font-bold text-neutral-400">소통 핑퐁 질문</TableHead>
                    <TableHead className="w-[140px] text-xs font-bold text-neutral-400">해시태그</TableHead>
                    <TableHead className="w-[90px] text-center text-xs font-bold text-neutral-400">반응</TableHead>
                    <TableHead className="w-[100px] text-xs font-bold text-neutral-400">등록일</TableHead>
                    <TableHead className="w-[130px] text-right text-xs font-bold text-neutral-400">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post, index) => {
                    const official = isOfficial(post);
                    const isChecked = selectedIds.includes(post.id);

                    // Extract title from first line if starts with 📌 or 💖
                    const lines = post.content.split('\n').filter((l) => l.trim().length > 0);
                    const titleCandidate = lines[0] || post.content;
                    const previewSnippet = lines.slice(1, 3).join(' ') || post.content.slice(0, 80);

                    return (
                      <TableRow
                        key={post.id}
                        className={`border-b border-neutral-800/60 transition-colors ${
                          isChecked
                            ? 'bg-amber-500/10'
                            : official
                            ? 'bg-rose-950/10 hover:bg-rose-950/20'
                            : 'hover:bg-neutral-800/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleSelect(post.id)}
                            aria-label={`선택 ${post.id}`}
                          />
                        </TableCell>

                        {/* No. */}
                        <TableCell className="text-center text-xs text-neutral-400 font-medium">
                          {index + 1}
                        </TableCell>

                        {/* 구분 */}
                        <TableCell>
                          {official ? (
                            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] px-2 py-0.5 whitespace-nowrap">
                              💖 공식 에디터
                            </Badge>
                          ) : (
                            <Badge className="bg-neutral-800 text-neutral-300 border-neutral-700 text-[10px] px-2 py-0.5 whitespace-nowrap">
                              👤 일반 회원
                            </Badge>
                          )}
                        </TableCell>

                        {/* 작성자 */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8 border border-neutral-700 flex-shrink-0">
                              <AvatarImage
                                src={official ? '/aura-magazine-logo.jpg' : post.userAvatar}
                                className="object-cover"
                              />
                              <AvatarFallback className="text-[10px] font-bold bg-neutral-800 text-amber-300">
                                {official ? 'Aura' : post.userName?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="truncate">
                              <div className="text-xs font-bold text-neutral-200 truncate flex items-center gap-1">
                                <span>{post.userName}</span>
                                {post.isVip && (
                                  <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-500 truncate">
                                {post.userAge ? `${post.userAge}세 · ` : ''}
                                {post.userGender || ''} {post.userLocation ? `· ${post.userLocation}` : ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* 본문 요약 (클릭 시 전문 모달) */}
                        <TableCell
                          className="cursor-pointer group"
                          onClick={() => setDetailPost(post)}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-neutral-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                              {titleCandidate}
                            </p>
                            <p className="text-[11px] text-neutral-400 line-clamp-1">
                              {previewSnippet}
                            </p>
                          </div>
                        </TableCell>

                        {/* 소통 핑퐁 질문 */}
                        <TableCell>
                          {post.discussionPrompt ? (
                            <div
                              className="text-[11px] text-rose-300/90 line-clamp-2 bg-rose-500/10 p-1.5 rounded-md border border-rose-500/20 cursor-pointer"
                              onClick={() => setDetailPost(post)}
                              title={post.discussionPrompt}
                            >
                              💬 {post.discussionPrompt}
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-600">-</span>
                          )}
                        </TableCell>

                        {/* 해시태그 */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {post.tags && post.tags.length > 0 ? (
                              post.tags.slice(0, 2).map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 truncate"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-neutral-600">-</span>
                            )}
                            {post.tags && post.tags.length > 2 && (
                              <span className="text-[9px] text-neutral-500">+{post.tags.length - 2}</span>
                            )}
                          </div>
                        </TableCell>

                        {/* 반응 (좋아요 / 댓글) */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400">
                            <span className="flex items-center gap-0.5">
                              <Heart className="w-3 h-3 text-rose-400" />
                              <span>{post.likesCount || 0}</span>
                            </span>
                            <span className="flex items-center gap-0.5">
                              <MessageCircle className="w-3 h-3 text-cyan-400" />
                              <span>{post.commentsCount || 0}</span>
                            </span>
                          </div>
                        </TableCell>

                        {/* 등록일 */}
                        <TableCell className="text-xs text-neutral-400 whitespace-nowrap">
                          {post.createdAt}
                        </TableCell>

                        {/* 관리 액션 */}
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDetailPost(post)}
                              className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-200"
                              title="상세보기"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(post)}
                              className="h-7 px-2 text-xs font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              수정
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingId(post.id)}
                              className="h-7 px-2 text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              삭제
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 🎴 Card View                                                              */
          /* ========================================================================= */
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const official = isOfficial(post);
              return (
                <div
                  key={post.id}
                  className={`rounded-2xl p-5 border transition-all ${
                    official
                      ? 'bg-gradient-to-b from-rose-950/30 via-neutral-900 to-neutral-950 border-rose-500/40 shadow-lg shadow-rose-950/30'
                      : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-neutral-700 shadow-md">
                        <AvatarImage
                          src={official ? '/aura-magazine-logo.jpg' : post.userAvatar}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-neutral-800 text-amber-300 font-bold text-xs">
                          {official ? 'Aura' : post.userName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-sm ${official ? 'text-rose-300' : 'text-neutral-100'}`}>
                            {post.userName}
                          </span>
                          {official && (
                            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] px-2 py-0">
                              공식 에디터
                            </Badge>
                          )}
                          {post.isVip && (
                            <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                              <Crown className="w-3 h-3 text-amber-400" />
                            </span>
                          )}
                          {post.userAge && (
                            <span className="text-xs text-neutral-400">· {post.userAge}세</span>
                          )}
                          {post.userGender && (
                            <span className="text-xs text-neutral-400">· {post.userGender}</span>
                          )}
                          {post.userLocation && (
                            <span className="text-xs text-neutral-400">· {post.userLocation}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          <span>ID: {post.id}</span>
                          <span className="mx-1.5">·</span>
                          <span>{post.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(post)}
                        className="h-8 px-2.5 text-xs font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        수정
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(post.id)}
                        className="h-8 px-2.5 text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800/80 mb-3 text-sm text-neutral-200 leading-relaxed whitespace-pre-line break-words max-h-60 overflow-y-auto">
                    {post.content}
                  </div>

                  {/* Discussion Prompt */}
                  {post.discussionPrompt && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs mb-3 text-left">
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                        <span className="text-sm">💬</span>
                        <span>Aura 공식 에디터의 소통 핑퐁</span>
                      </div>
                      <p className="text-neutral-200 leading-relaxed pl-5 font-medium">
                        {post.discussionPrompt}
                      </p>
                    </div>
                  )}

                  {/* Tags & Footer stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-400 flex-wrap gap-2">
                    <div className="flex flex-wrap gap-1">
                      {post.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span>{post.likesCount || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{post.commentsCount || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📖 Detail View Dialog                                                     */}
      {/* ========================================================================= */}
      <Dialog open={!!detailPost} onOpenChange={(open) => !open && setDetailPost(null)}>
        {detailPost && (
          <DialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100 max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader className="text-left pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-8 h-8 border border-neutral-700">
                  <AvatarImage
                    src={isOfficial(detailPost) ? '/aura-magazine-logo.jpg' : detailPost.userAvatar}
                  />
                  <AvatarFallback className="text-xs font-bold bg-neutral-800 text-amber-300">
                    {isOfficial(detailPost) ? 'Aura' : detailPost.userName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-neutral-100">{detailPost.userName}</span>
                    {isOfficial(detailPost) && (
                      <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] px-1.5 py-0">
                        공식
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500">{detailPost.createdAt}</span>
                </div>
              </div>
              <DialogTitle className="text-base font-bold text-neutral-100">
                스레드 글 상세 전문
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-3 text-left">
              {/* Full Content */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-200 leading-relaxed whitespace-pre-line break-words max-h-96 overflow-y-auto">
                {detailPost.content}
              </div>

              {/* Discussion Prompt */}
              {detailPost.discussionPrompt && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                    <span className="text-sm">💬</span>
                    <span>Aura 공식 에디터의 소통 핑퐁</span>
                  </div>
                  <p className="text-neutral-200 leading-relaxed pl-5 font-medium">
                    {detailPost.discussionPrompt}
                  </p>
                </div>
              )}

              {/* Tags */}
              {detailPost.tags && detailPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {detailPost.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comments count */}
              <div className="pt-2 border-t border-neutral-800/80 text-xs text-neutral-400 flex items-center gap-4">
                <span>❤️ 좋아요 {detailPost.likesCount || 0}개</span>
                <span>💬 댓글 {detailPost.commentsCount || 0}개</span>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-neutral-800 flex justify-between sm:justify-between items-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeletingId(detailPost.id);
                  setDetailPost(null);
                }}
                className="text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                이 글 삭제
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleOpenEdit(detailPost);
                    setDetailPost(null);
                  }}
                  className="border-neutral-800 text-amber-300 hover:bg-neutral-900 text-xs"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  수정하기
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setDetailPost(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs"
                >
                  닫기
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit / Create Thread Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100 max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="text-left pb-3 border-b border-neutral-800">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <span>{editingPost ? '✏️ 스레드 글 수정' : '💖 새 공식 스레드 작성'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400 font-semibold">스레드 본문 내용</Label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                placeholder="스레드 본문 내용을 작성해 주세요."
                className="bg-neutral-900 border-neutral-800 text-sm leading-relaxed"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400 font-semibold">
                💬 소통 핑퐁 질문 (Aura 공식 에디터의 소통 유도 질문 박스)
              </Label>
              <Textarea
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                rows={3}
                placeholder="유저들의 댓글 참여를 유도하는 질문을 입력해 주세요. (선택)"
                className="bg-neutral-900 border-neutral-800 text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">해시태그 (쉼표로 구분)</Label>
              <Input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="#소개팅, #Aura공식, #카톡팁"
                className="bg-neutral-900 border-neutral-800 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditorOpen(false)}
                className="border-neutral-800 text-neutral-300 hover:bg-neutral-900"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#FFF3D1] via-[#E5A934] to-[#C98718] text-black font-bold"
              >
                {editingPost ? '수정사항 저장' : '공식 스레드 발행'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Selected Alert Dialog */}
      <AlertDialog open={isBatchDeleteAlertOpen} onOpenChange={setIsBatchDeleteAlertOpen}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100 max-w-sm rounded-2xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-bold text-rose-400 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>선택한 {selectedIds.length}개 스레드를 삭제하시겠습니까?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-neutral-400">
              선택한 스레드 글들이 라운지 피드 및 데이터베이스에서 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel
              disabled={isBatchDeleting}
              className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 text-xs"
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              {isBatchDeleting ? '삭제 중...' : '선택 글 삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Alert Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100 max-w-sm rounded-2xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-bold text-neutral-100">
              정말로 이 스레드 글을 삭제하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-neutral-400">
              삭제된 스레드 글은 라운지 피드 및 데이터베이스에서 영구적으로 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 text-xs">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Official Alert Dialog */}
      <AlertDialog open={isDeleteOfficialOpen} onOpenChange={setIsDeleteOfficialOpen}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100 max-w-sm rounded-2xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>공식 스레드만 전체 삭제하시겠습니까?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-neutral-400">
              "💖 Aura 공식 매거진" 명의로 발행된 모든 스레드 글이 라운지 피드 및 데이터베이스에서 일괄 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 text-xs">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOfficial}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              공식 스레드 일괄 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Alert Dialog */}
      <AlertDialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100 max-w-sm rounded-2xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>모든 스레드 글을 전체 초기화하시겠습니까?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-neutral-400">
              라운지 피드의 모든 스레드 글(공식 글 및 일반 회원 글 포함)이 영구적으로 완전 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 text-xs">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              전체 초기화 실행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
