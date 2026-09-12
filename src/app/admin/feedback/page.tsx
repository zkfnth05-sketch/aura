'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin-layout';
import { fetchAllCustomerFeedbacks, updateCustomerFeedbackStatus, submitCustomerFeedback, deleteCustomerFeedback, clearAllCustomerFeedbacks, type CustomerFeedback } from '@/lib/supabaseDataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, AlertTriangle, Bug, Lightbulb, Sparkles, RefreshCw, CheckCircle2, Clock, Smartphone, ExternalLink, ShieldCheck, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'new_only' | 'error_bug' | 'feature_idea' | 'ui_ux' | 'other'>('all');
    
    // 스크린샷 확대 모달
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    // 관리자 메모 임시 수정 상태 (id -> note)
    const [adminNotes, setAdminNotes] = useState<{ [id: string]: string }>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);

    const { toast } = useToast();

    const loadFeedbacks = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllCustomerFeedbacks();
            setFeedbacks(data || []);
            // 관리자 메모 초기화
            const initialNotes: { [id: string]: string } = {};
            (data || []).forEach(f => {
                initialNotes[f.id] = f.admin_note || '';
            });
            setAdminNotes(initialNotes);
        } catch (e) {
            console.error('Error loading feedbacks:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFeedbacks();
    }, []);

    // 상태 변경 핸들러
    const handleStatusChange = async (id: string, newStatus: 'new' | 'in_progress' | 'resolved') => {
        setUpdatingId(id);
        try {
            const currentNote = adminNotes[id] || '';
            const ok = await updateCustomerFeedbackStatus(id, newStatus, currentNote);
            if (ok) {
                setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
                toast({
                    title: '상태 업데이트 완료',
                    description: `해당 피드백의 처리 상태가 변경되었습니다.`,
                });
            } else {
                toast({
                    title: '업데이트 실패',
                    description: '상태 변경 중 오류가 발생했습니다.',
                    variant: 'destructive',
                });
            }
        } finally {
            setUpdatingId(null);
        }
    };

    // 관리자 메모 저장 핸들러
    const handleSaveNote = async (id: string) => {
        setUpdatingId(id);
        try {
            const fb = feedbacks.find(f => f.id === id);
            if (!fb) return;
            const noteToSave = adminNotes[id] || '';
            const ok = await updateCustomerFeedbackStatus(id, fb.status, noteToSave);
            if (ok) {
                toast({
                    title: '메모 저장 완료',
                    description: '관리자 조치 메모가 정상적으로 저장되었습니다.',
                });
            } else {
                toast({
                    title: '저장 실패',
                    description: '메모 저장 중 오류가 발생했습니다.',
                    variant: 'destructive',
                });
            }
        } finally {
            setUpdatingId(null);
        }
    };

    // 단일 피드백 삭제 핸들러
    const handleDeleteFeedback = async (id: string) => {
        if (!confirm('이 피드백을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.')) return;
        setUpdatingId(id);
        try {
            const ok = await deleteCustomerFeedback(id);
            if (ok) {
                setFeedbacks(prev => prev.filter(f => f.id !== id));
                toast({
                    title: '삭제 완료',
                    description: '피드백이 목록에서 삭제되었습니다.',
                });
            } else {
                toast({
                    title: '삭제 실패',
                    description: '데이터베이스 삭제 정책(RLS)을 확인해 주세요.',
                    variant: 'destructive',
                });
            }
        } finally {
            setUpdatingId(null);
        }
    };

    // 피드백 전체 삭제 핸들러
    const handleClearAllFeedbacks = async () => {
        if (feedbacks.length === 0) return;
        if (!confirm(`현재 등록된 모든 피드백(${feedbacks.length}건)을 정말 전부 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`)) return;
        setIsLoading(true);
        try {
            const ok = await clearAllCustomerFeedbacks();
            if (ok) {
                setFeedbacks([]);
                toast({
                    title: '전체 삭제 완료',
                    description: '모든 피드백이 성공적으로 비워졌습니다.',
                });
            } else {
                toast({
                    title: '삭제 실패',
                    description: '데이터베이스 삭제 권한을 확인해 주세요.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 테스트용 샘플 의견 주입 핸들러
    const handleSeedSampleFeedbacks = async () => {
        if (!confirm('테스트 검증을 위해 오류 제보 및 기능 제안 샘플 4건을 Supabase에 등록하시겠습니까?')) return;
        setIsSeeding(true);
        try {
            await submitCustomerFeedback({
                user_name: '김지현 (회원)',
                user_phone: '010-3344-5566',
                category: 'error_bug',
                content: '프로필 사진을 3장 이상 올릴 때 간헐적으로 업로드 완료 팝업이 늦게 뜨거나 멈춥니다. 확인 부탁드려요!',
                device_info: '기기: iPhone 15 Pro | OS: iOS 17.5 | 브라우저: Mobile Safari | URL: /profile/edit',
            });
            await submitCustomerFeedback({
                user_name: 'David Kim',
                user_phone: '010-7788-9900',
                category: 'feature_idea',
                content: '매칭된 상대와 대화할 때 서로의 관심사를 한눈에 비교할 수 있는 뱃지 기능이 있으면 대화 시작하기가 훨씬 수월할 것 같아요!',
                device_info: '기기: Galaxy S24 Ultra | OS: Android 14 | 브라우저: Chrome Mobile | URL: /matches',
            });
            await submitCustomerFeedback({
                user_name: '이수진',
                user_phone: '010-1234-5678',
                category: 'ui_ux',
                content: '야간에 라운지 피드를 볼 때 글씨 색상이 조금 더 밝았으면 좋겠습니다. 가독성 개선 건의드립니다.',
                device_info: '기기: Windows PC | OS: Win11 | 브라우저: Chrome 124 | URL: /lounge',
            });
            await submitCustomerFeedback({
                user_name: '박민우',
                user_phone: '010-9876-5432',
                category: 'other',
                content: '50:50 성비 조절 시스템이랑 번개 레이더 기능 진짜 신선하고 재밌네요. 번창하세요!',
                device_info: '기기: iPhone 14 | OS: iOS 17.2 | 브라우저: Naver InApp | URL: /map',
            });
            toast({
                title: '샘플 피드백 등록 완료',
                description: '테스트용 고객 의견 4건이 Supabase에 성공적으로 추가되었습니다.',
            });
            await loadFeedbacks();
        } catch (e: any) {
            toast({
                title: '등록 실패',
                description: e.message,
                variant: 'destructive',
            });
        } finally {
            setIsSeeding(false);
        }
    };

    // 통계 계산
    const stats = useMemo(() => {
        const total = feedbacks.length;
        const newCount = feedbacks.filter(f => f.status === 'new').length;
        const bugCount = feedbacks.filter(f => f.category === 'error_bug').length;
        const ideaCount = feedbacks.filter(f => f.category === 'feature_idea').length;
        const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length;

        return { total, newCount, bugCount, ideaCount, resolvedCount };
    }, [feedbacks]);

    // 필터링 목록
    const filteredFeedbacks = useMemo(() => {
        if (categoryFilter === 'all') return feedbacks;
        if (categoryFilter === 'new_only') return feedbacks.filter(f => f.status === 'new');
        return feedbacks.filter(f => f.category === categoryFilter);
    }, [feedbacks, categoryFilter]);

    // 카테고리 뱃지 렌더러
    const renderCategoryBadge = (cat: CustomerFeedback['category']) => {
        switch (cat) {
            case 'error_bug':
                return (
                    <Badge variant="outline" className="bg-rose-500/15 text-rose-300 border-rose-500/40 gap-1 text-xs">
                        <Bug className="h-3 w-3" /> 오류/버그 제보
                    </Badge>
                );
            case 'feature_idea':
                return (
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-300 border-amber-500/40 gap-1 text-xs">
                        <Lightbulb className="h-3 w-3" /> 새로운 기능 제안
                    </Badge>
                );
            case 'ui_ux':
                return (
                    <Badge variant="outline" className="bg-sky-500/15 text-sky-300 border-sky-500/40 gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" /> 이용 불편 사항
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-primary/15 text-primary border-primary/40 gap-1 text-xs">
                        <Sparkles className="h-3 w-3" /> 일반 의견/칭찬
                    </Badge>
                );
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 pb-12">
                {/* 1. 상단 관제 바 */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-primary/20 shadow-xl">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/30">
                                실시간 고객 소리 (VOC) 센터
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                            <span>고객 피드백 & 오류·개선 제보 관제</span>
                        </h1>
                        <p className="text-xs md:text-sm text-neutral-400 mt-1">
                            사용자가 프로필에서 [문제 신고 및 의견 보내기]로 남긴 오류와 아이디어를 확인하고 수정합니다.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSeedSampleFeedbacks}
                            disabled={isSeeding}
                            className="border-primary/40 hover:border-primary text-primary hover:bg-primary/10 text-xs font-semibold gap-1.5"
                        >
                            {isSeeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            {isSeeding ? '샘플 등록 중...' : '샘플 의견 4건 생성'}
                        </Button>

                        {feedbacks.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearAllFeedbacks}
                                disabled={isLoading}
                                className="border-rose-500/40 hover:border-rose-500 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold gap-1.5"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                전체 비우기
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={loadFeedbacks}
                            disabled={isLoading}
                            className="text-neutral-400 hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* 2. 상단 4대 핵심 지표 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-neutral-900/90 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">총 접수 피드백</CardTitle>
                            <MessageSquare className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-white font-mono">{stats.total}건</div>
                            <p className="text-xs text-neutral-500 mt-1">누적 고객 의견 총계</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/90 border-neutral-800 relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-rose-400">신규 미확인 접수</CardTitle>
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-rose-400 font-mono">{stats.newCount}건</div>
                            <p className="text-xs text-rose-400/80 mt-1">확인 및 조치가 필요한 항목</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/90 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">오류 / 버그 제보</CardTitle>
                            <Bug className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-white font-mono">{stats.bugCount}건</div>
                            <p className="text-xs text-neutral-500 mt-1">기능 오작동 및 버그</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/90 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">새로운 기능 제안</CardTitle>
                            <Lightbulb className="h-4 w-4 text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-amber-400 font-mono">{stats.ideaCount}건</div>
                            <p className="text-xs text-neutral-500 mt-1">서비스 개선 유저 아이디어</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. 카테고리 필터 컨트롤 바 */}
                <div className="flex items-center gap-1.5 overflow-x-auto bg-neutral-900/60 p-2 rounded-xl border border-neutral-800 text-xs">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            categoryFilter === 'all' ? 'bg-primary text-black' : 'text-neutral-400 hover:text-white bg-neutral-950'
                        }`}
                    >
                        전체 ({stats.total})
                    </button>
                    <button
                        onClick={() => setCategoryFilter('new_only')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                            categoryFilter === 'new_only' ? 'bg-rose-500 text-white' : 'text-rose-400 hover:text-white bg-neutral-950'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        신규 미확인만 ({stats.newCount})
                    </button>
                    <button
                        onClick={() => setCategoryFilter('error_bug')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            categoryFilter === 'error_bug' ? 'bg-rose-500/80 text-white' : 'text-neutral-400 hover:text-white bg-neutral-950'
                        }`}
                    >
                        🛠️ 오류/버그 ({stats.bugCount})
                    </button>
                    <button
                        onClick={() => setCategoryFilter('feature_idea')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            categoryFilter === 'feature_idea' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white bg-neutral-950'
                        }`}
                    >
                        💡 기능 제안 ({stats.ideaCount})
                    </button>
                    <button
                        onClick={() => setCategoryFilter('ui_ux')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            categoryFilter === 'ui_ux' ? 'bg-sky-500 text-white' : 'text-neutral-400 hover:text-white bg-neutral-950'
                        }`}
                    >
                        ⚠️ 이용 불편
                    </button>
                </div>

                {/* 4. 피드백 상세 리스트 */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/40 rounded-2xl border border-neutral-800">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-neutral-400">고객 피드백 목록을 불러오고 있습니다...</p>
                        </div>
                    ) : filteredFeedbacks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/40 rounded-2xl border border-dashed border-neutral-800 text-center p-6">
                            <MessageSquare className="h-10 w-10 text-neutral-600 mb-3" />
                            <p className="text-base font-bold text-neutral-300">접수된 피드백이 없습니다.</p>
                            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                                사용자가 프로필에서 의견을 제출하면 여기에 실시간으로 표시됩니다. 상단의 <strong>[샘플 의견 4건 생성]</strong> 버튼으로 테스트해 보세요!
                            </p>
                        </div>
                    ) : (
                        filteredFeedbacks.map((item) => (
                            <Card key={item.id} className="bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 transition-all shadow-lg overflow-hidden">
                                <CardHeader className="p-4 pb-3 border-b border-neutral-800/80 bg-neutral-950/40 flex flex-row items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        {renderCategoryBadge(item.category)}
                                        <span className="text-xs font-bold text-white">
                                            {item.user_name || '익명'}
                                        </span>
                                        {item.user_phone && (
                                            <span className="text-xs font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                                {item.user_phone}
                                            </span>
                                        )}
                                        <span className="text-[11px] text-neutral-500">
                                            {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                                        </span>
                                    </div>

                                    {/* 상태 선택 셀렉트 */}
                                    <div className="flex items-center gap-1 text-xs">
                                        <button
                                            onClick={() => handleStatusChange(item.id, 'new')}
                                            disabled={updatingId === item.id}
                                            className={`px-2.5 py-1 rounded font-bold transition-all border ${
                                                item.status === 'new'
                                                    ? 'bg-rose-500 text-white border-rose-500'
                                                    : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
                                            }`}
                                        >
                                            신규 접수
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(item.id, 'in_progress')}
                                            disabled={updatingId === item.id}
                                            className={`px-2.5 py-1 rounded font-bold transition-all border ${
                                                item.status === 'in_progress'
                                                    ? 'bg-amber-500 text-black border-amber-500'
                                                    : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
                                            }`}
                                        >
                                            검토/수정 중
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(item.id, 'resolved')}
                                            disabled={updatingId === item.id}
                                            className={`px-2.5 py-1 rounded font-bold transition-all border ${
                                                item.status === 'resolved'
                                                    ? 'bg-emerald-500 text-black border-emerald-500'
                                                    : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
                                            }`}
                                        >
                                            ✓ 해결/반영 완료
                                        </button>

                                        {/* 삭제 버튼 */}
                                        <button
                                            onClick={() => handleDeleteFeedback(item.id)}
                                            disabled={updatingId === item.id}
                                            className="p-1.5 px-2.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/15 border border-neutral-800 hover:border-rose-500/40 transition-all ml-1.5 flex items-center gap-1 font-bold text-xs"
                                            title="이 피드백 영구 삭제"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-rose-500/80" />
                                            <span className="hidden sm:inline text-rose-400">삭제</span>
                                        </button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 space-y-3.5">
                                    {/* 상세 본문 */}
                                    <div className="text-xs md:text-sm text-neutral-100 whitespace-pre-wrap leading-relaxed font-sans bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
                                        {item.content}
                                    </div>

                                    {/* 첨부 스크린샷 */}
                                    {item.screenshot_url && (
                                        <div>
                                            <p className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1">
                                                <span>📷 첨부된 화면 캡처:</span>
                                                <span className="text-primary text-[10px]">(클릭 시 원본 확대)</span>
                                            </p>
                                            <div
                                                onClick={() => setPreviewImage(item.screenshot_url || null)}
                                                className="relative w-40 h-28 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 cursor-pointer hover:border-primary transition-all group"
                                            >
                                                <Image src={item.screenshot_url} alt="스크린샷 미리보기" fill className="object-cover group-hover:scale-105 transition-transform" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Eye className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 자동 수집 기기 정보 */}
                                    {item.device_info && (
                                        <div className="p-2.5 rounded-lg bg-neutral-950/40 border border-neutral-800/60 flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                                            <Smartphone className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                                            <span className="truncate">{item.device_info}</span>
                                        </div>
                                    )}

                                    {/* 관리자 메모 영역 */}
                                    <div className="pt-2 border-t border-neutral-800/60 flex items-center gap-2">
                                        <Textarea
                                            value={adminNotes[item.id] !== undefined ? adminNotes[item.id] : (item.admin_note || '')}
                                            onChange={(e) => setAdminNotes({ ...adminNotes, [item.id]: e.target.value })}
                                            placeholder="관리자 조치 내역 및 코드 수정 메모를 입력해 두세요. (예: 09/12 스토리지 RLS 정책 수정 완료)"
                                            className="h-10 min-h-[38px] py-2 px-3 text-xs bg-neutral-950 border-neutral-800 text-neutral-200 rounded-xl resize-none focus:border-primary flex-grow"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleSaveNote(item.id)}
                                            disabled={updatingId === item.id}
                                            className="h-10 px-4 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl shrink-0"
                                        >
                                            {updatingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '메모 저장'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* 스크린샷 확대 다이얼로그 */}
            <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-2xl w-[94vw] bg-neutral-950 border-neutral-800 text-white rounded-2xl p-4">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-neutral-300">첨부 스크린샷 원본 보기</DialogTitle>
                    </DialogHeader>
                    {previewImage && (
                        <div className="relative w-full h-[65vh] rounded-xl overflow-hidden bg-neutral-900">
                            <Image src={previewImage} alt="원본 스크린샷" fill className="object-contain" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
