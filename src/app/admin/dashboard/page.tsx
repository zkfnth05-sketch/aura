'use client';

import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { fetchAllUsers, fetchTrafficLogs, fetchTotalTrafficCount, seedSampleTrafficData, clearAllTrafficLogs, type TrafficLog } from '@/lib/supabaseDataService';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, TrendingUp, Users, Compass, Activity, Database, Sparkles, RefreshCw, Trash2, Smartphone, Laptop } from 'lucide-react';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('today');
    const [channelCategoryFilter, setChannelCategoryFilter] = useState<'all' | 'sns' | 'messenger' | 'search' | 'community'>('all');
    
    const [users, setUsers] = useState<User[]>([]);
    const [trafficLogs, setTrafficLogs] = useState<TrafficLog[]>([]);
    const [totalCumulativePV, setTotalCumulativePV] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [timeSlotWindow, setTimeSlotWindow] = useState<'all' | 'firstHalf' | 'secondHalf'>('all');

    // 데이터 로드
    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [usersData, logsData, totalCount] = await Promise.all([
                fetchAllUsers(500),
                fetchTrafficLogs(period),
                fetchTotalTrafficCount(),
            ]);
            setUsers(usersData || []);
            setTrafficLogs(logsData || []);
            setTotalCumulativePV(totalCount || (logsData?.length || 0));
        } catch (e) {
            console.error('Error fetching dashboard data:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [period]);

    // 초기 샘플 데이터 주입 핸들러
    const handleSeedData = async () => {
        if (confirm('오늘 24시간 및 최근 30일간의 실감나는 전 채널(네이버, 구글, 틱톡, 카카오톡, 레딧, 스레드, 텔레그램 등) 유입 데이터를 Supabase에 주입하시겠습니까?')) {
            setIsSeeding(true);
            try {
                const res = await seedSampleTrafficData();
                if (res.success) {
                    alert(`✅ ${res.count}건의 실시간 유입 데이터가 성공적으로 주입되었습니다!`);
                    await loadDashboardData();
                } else {
                    alert('데이터 주입 중 일부 문제가 발생했습니다. Supabase 테이블이 생성되었는지 확인해 주세요.');
                }
            } catch (err: any) {
                alert('주입 실패: ' + err.message);
            } finally {
                setIsSeeding(false);
            }
        }
    };

    // 트래픽 데이터 0으로 초기화 핸들러
    const handleResetData = async () => {
        if (confirm('수집된 모든 방문/유입 로그를 삭제하고 0건으로 리셋하시겠습니까?')) {
            setIsLoading(true);
            try {
                const ok = await clearAllTrafficLogs();
                if (ok) {
                    await loadDashboardData();
                } else {
                    alert('초기화 완료를 위해 Supabase SQL Editor에서 TRUNCATE TABLE site_traffic_logs; 명령어를 1회 실행해 주세요.');
                }
            } catch (e: any) {
                alert('초기화 실패: ' + e.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // 1. 핵심 KPI 지표 계산
    const kpiMetrics = useMemo(() => {
        const periodPV = trafficLogs.length;
        const uniqueVisitors = new Set(trafficLogs.map(l => l.session_id)).size;
        const totalUserCount = users.length;
        const conversionRate = periodPV > 0 ? Math.min(100, ((totalUserCount / Math.max(1, uniqueVisitors)) * 100)).toFixed(1) : '0.0';

        return {
            periodPV,
            uniqueVisitors,
            cumulativePV: Math.max(totalCumulativePV, periodPV),
            conversionRate,
            totalUsers: totalUserCount,
        };
    }, [trafficLogs, users, totalCumulativePV]);

    // 2. 시간대별 / 일별 차트 데이터 생성
    const chartData = useMemo(() => {
        if (period === 'today') {
            // 00시 ~ 23시 24시간대 슬롯
            const hourlyMap: { [hour: number]: number } = {};
            for (let i = 0; i < 24; i++) hourlyMap[i] = 0;

            trafficLogs.forEach(log => {
                const d = new Date(log.created_at);
                const h = d.getHours();
                hourlyMap[h] = (hourlyMap[h] || 0) + 1;
            });

            let slots = Object.keys(hourlyMap).map(h => ({
                label: `${h.padStart(2, '0')}시`,
                hour: Number(h),
                pv: hourlyMap[Number(h)],
            }));

            if (timeSlotWindow === 'firstHalf') {
                slots = slots.filter(s => s.hour < 12);
            } else if (timeSlotWindow === 'secondHalf') {
                slots = slots.filter(s => s.hour >= 12);
            }

            return slots;
        } else if (period === 'weekly' || period === 'monthly') {
            // 날짜별 (MM-dd)
            const dateMap: { [key: string]: number } = {};
            trafficLogs.forEach(log => {
                const dateKey = format(new Date(log.created_at), 'MM/dd');
                dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
            });
            return Object.entries(dateMap).map(([date, pv]) => ({
                label: date,
                pv,
            }));
        } else {
            // 연간 (yyyy-MM)
            const monthMap: { [key: string]: number } = {};
            trafficLogs.forEach(log => {
                const mKey = format(new Date(log.created_at), 'yy년 MM월');
                monthMap[mKey] = (monthMap[mKey] || 0) + 1;
            });
            return Object.entries(monthMap).map(([m, pv]) => ({
                label: m,
                pv,
            }));
        }
    }, [trafficLogs, period, timeSlotWindow]);

    // 3. 16대 채널별 정밀 집계 데이터
    const channelRankings = useMemo(() => {
        // 기본 16대 채널 마스터 정의
        const baseChannels = [
            { name: '네이버 (검색/블로그/카페)', category: 'search', icon: 'N', color: 'bg-emerald-600' },
            { name: '카카오톡 (오픈채팅/알림톡)', category: 'messenger', icon: '💬', color: 'bg-yellow-500 text-black' },
            { name: '틱톡 (TikTok 바이럴)', category: 'sns', icon: '🎵', color: 'bg-rose-500' },
            { name: '구글 (Google 다국어 검색)', category: 'search', icon: 'G', color: 'bg-blue-500' },
            { name: '인스타그램 (릴스/스토리)', category: 'sns', icon: '📷', color: 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600' },
            { name: '스레드 (Threads)', category: 'sns', icon: '@', color: 'bg-neutral-800' },
            { name: '레딧 (Reddit)', category: 'community', icon: '👽', color: 'bg-orange-500' },
            { name: '텔레그램 (Telegram 채널)', category: 'messenger', icon: '✈️', color: 'bg-sky-500' },
            { name: '티스토리 (블로그 리뷰)', category: 'community', icon: 'T', color: 'bg-amber-600' },
            { name: '지인 초대 (친구추천 링크)', category: 'messenger', icon: '🎁', color: 'bg-primary text-primary-foreground' },
            { name: '유튜브 (소개 영상/링크)', category: 'sns', icon: '▶', color: 'bg-red-600' },
            { name: '페이스북 (Facebook 커뮤니티)', category: 'sns', icon: 'f', color: 'bg-blue-600' },
            { name: 'X (트위터 실시간 트렌드)', category: 'sns', icon: '𝕏', color: 'bg-neutral-700' },
            { name: '기타 다이렉트 / 북마크', category: 'direct', icon: '🔗', color: 'bg-neutral-600' },
        ];

        // 로그 데이터에서 채널별 PV 및 UV 집계
        const stats: { [ch: string]: { pv: number; uvs: Set<string>; category: string } } = {};

        // 베이스 채널 초기화
        baseChannels.forEach(b => {
            stats[b.name] = { pv: 0, uvs: new Set(), category: b.category };
        });

        // 실제 로그 반영
        trafficLogs.forEach(log => {
            const chName = log.channel || '기타 다이렉트 / 북마크';
            if (!stats[chName]) {
                stats[chName] = { pv: 0, uvs: new Set(), category: log.channel_category || 'direct' };
            }
            stats[chName].pv += 1;
            stats[chName].uvs.add(log.session_id);
        });

        const totalPV = Math.max(1, trafficLogs.length);

        const list = Object.entries(stats).map(([name, data]) => {
            const baseInfo = baseChannels.find(b => b.name === name);
            const percentage = ((data.pv / totalPV) * 100).toFixed(1);
            return {
                name,
                category: data.category,
                icon: baseInfo?.icon || '🌐',
                color: baseInfo?.color || 'bg-neutral-700',
                pv: data.pv,
                uv: data.uvs.size,
                percentage: Number(percentage),
            };
        });

        // PV 높은 순 정렬
        list.sort((a, b) => b.pv - a.pv);

        // 카테고리 필터링
        if (channelCategoryFilter === 'all') return list;
        return list.filter(item => item.category === channelCategoryFilter);
    }, [trafficLogs, channelCategoryFilter]);

    return (
        <AdminLayout>
            <div className="space-y-6 pb-12">
                {/* 1. 상단 관제 센터 타이틀 바 */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-primary/20 shadow-xl">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                실시간 관제 시스템 정상 가동 중
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                            <span>실시간 유입 정밀 분석 & 트래픽 관제 대시보드</span>
                        </h1>
                        <p className="text-xs md:text-sm text-neutral-400 mt-1">
                            네이버, 구글, 레딧, 스레드, 텔레그램, 틱톡, 카카오톡 등 전 채널의 24시간 시간대별 트래픽을 정밀 분석합니다.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* 샘플 데이터 주입 버튼 */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSeedData}
                            disabled={isSeeding}
                            className="border-primary/40 hover:border-primary text-primary hover:bg-primary/10 text-xs font-semibold gap-1.5"
                        >
                            {isSeeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                            {isSeeding ? '데이터 주입 중...' : '샘플 트래픽 주입'}
                        </Button>

                        {/* 트래픽 0으로 초기화 버튼 */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetData}
                            disabled={isLoading}
                            className="border-rose-500/40 hover:border-rose-500 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            트래픽 0으로 초기화
                        </Button>

                        {/* 새로고침 */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={loadDashboardData}
                            disabled={isLoading}
                            className="text-neutral-400 hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* 2. 기간 선택 탭 (KTRS 모델) */}
                <div className="flex items-center justify-between flex-wrap gap-3 bg-neutral-900/60 p-2 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                        <button
                            onClick={() => setPeriod('today')}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                period === 'today'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                            }`}
                        >
                            ⚡ 오늘 (24시간)
                        </button>
                        <button
                            onClick={() => setPeriod('weekly')}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                period === 'weekly'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                            }`}
                        >
                            📅 주간 (최근 7일)
                        </button>
                        <button
                            onClick={() => setPeriod('monthly')}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                period === 'monthly'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                            }`}
                        >
                            📊 월간 (30일)
                        </button>
                        <button
                            onClick={() => setPeriod('yearly')}
                            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                period === 'yearly'
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                            }`}
                        >
                            📈 연간 (YoY 성장)
                        </button>
                    </div>

                    <div className="text-xs text-neutral-400 px-2 font-mono">
                        기준: KST (한국 표준시) | {period === 'today' ? '오늘 24시간 실시간' : period === 'weekly' ? '최근 7일 누적' : period === 'monthly' ? '최근 30일' : '연간 분석'}
                    </div>
                </div>

                {/* 3. 상단 4대 핵심 KPI 카드 (KTRS 모델) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800 relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">
                                {period === 'today' ? '오늘 페이지뷰 (PV)' : '선택 기간 PV'}
                            </CardTitle>
                            <Eye className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                {isLoading ? '-' : `${kpiMetrics.periodPV.toLocaleString()} `}
                                <span className="text-xs md:text-sm font-normal text-neutral-400">회</span>
                            </div>
                            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                                <TrendingUp className="h-3 w-3 inline" /> 실시간 감지 누적
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800 relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">전체 누적 PV</CardTitle>
                            <Database className="h-4 w-4 text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                {isLoading ? '-' : `${kpiMetrics.cumulativePV.toLocaleString()} `}
                                <span className="text-xs md:text-sm font-normal text-neutral-400">회</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1">유입 경로를 통한 전체 총계</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800 relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">활성 방문자 수 (UV)</CardTitle>
                            <Users className="h-4 w-4 text-sky-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                {isLoading ? '-' : `${kpiMetrics.uniqueVisitors.toLocaleString()} `}
                                <span className="text-xs md:text-sm font-normal text-neutral-400">명</span>
                            </div>
                            <p className="text-[11px] text-sky-400 mt-1">중복 제외 순 방문자</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800 relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">가입 전환율 (CVR)</CardTitle>
                            <Activity className="h-4 w-4 text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                {isLoading ? '-' : `${kpiMetrics.conversionRate}%`}
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1">
                                총 회원 {kpiMetrics.totalUsers}명 기준
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. 메인 분석 섹션 (시간대별 추이 차트 + 16대 채널별 실제 유입 순위표) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* 좌측 (7칸): 24시간 시간대별 트래픽 차트 */}
                    <Card className="lg:col-span-7 bg-neutral-900/90 border-neutral-800 shadow-xl flex flex-col">
                        <CardHeader className="pb-3 border-b border-neutral-800/80 flex flex-row items-center justify-between flex-wrap gap-2">
                            <div>
                                <CardTitle className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                    <span>📊 {period === 'today' ? '오늘 24시간 시간대별 추이 (00시~23시)' : period === 'weekly' ? '최근 7일 일별 방문 추이' : period === 'monthly' ? '최근 30일 일별 추이' : '연간 월별 트래픽 실적'}</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-400 mt-0.5">
                                    {period === 'today' ? '마우스 호버 시 각 시간대별 정확한 방문 수를 확인할 수 있습니다.' : '일자별 트래픽 추이 및 유입 패턴 분석'}
                                </CardDescription>
                            </div>

                            {period === 'today' && (
                                <div className="flex items-center gap-1 text-xs bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                                    <button
                                        onClick={() => setTimeSlotWindow('all')}
                                        className={`px-2.5 py-1 rounded font-medium transition-all ${timeSlotWindow === 'all' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                                    >
                                        전체
                                    </button>
                                    <button
                                        onClick={() => setTimeSlotWindow('firstHalf')}
                                        className={`px-2.5 py-1 rounded font-medium transition-all ${timeSlotWindow === 'firstHalf' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                                    >
                                        00~12시
                                    </button>
                                    <button
                                        onClick={() => setTimeSlotWindow('secondHalf')}
                                        className={`px-2.5 py-1 rounded font-medium transition-all ${timeSlotWindow === 'secondHalf' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                                    >
                                        12~23시
                                    </button>
                                </div>
                            )}
                        </CardHeader>

                        <CardContent className="pt-6 flex-grow flex flex-col justify-between">
                            {isLoading ? (
                                <div className="flex h-[320px] items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : chartData.length === 0 || chartData.every(c => c.pv === 0) ? (
                                <div className="flex flex-col h-[320px] items-center justify-center text-center p-6 bg-neutral-950/40 rounded-xl border border-dashed border-neutral-800">
                                    <Compass className="h-10 w-10 text-neutral-600 mb-2" />
                                    <p className="text-sm font-semibold text-neutral-300">수집된 트래픽 로그가 아직 없습니다.</p>
                                    <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                                        우측 상단의 <strong className="text-primary">[샘플 트래픽 주입]</strong> 버튼을 누르면 실시간 24시간 통계 그래프를 즉시 채워보실 수 있습니다.
                                    </p>
                                </div>
                            ) : (
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="barGoldGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#E5A934" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#8A5A0A" stopOpacity={0.85} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                                            <XAxis
                                                dataKey="label"
                                                tickLine={false}
                                                axisLine={false}
                                                stroke="#737373"
                                                fontSize={11}
                                                interval={period === 'today' ? (timeSlotWindow === 'all' ? 1 : 0) : 'preserveEnd'}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                stroke="#737373"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(229, 169, 52, 0.08)' }}
                                                contentStyle={{
                                                    backgroundColor: '#171717',
                                                    borderColor: '#404040',
                                                    borderRadius: '0.75rem',
                                                    color: '#fff',
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                                }}
                                                formatter={(value: any) => [`${value}회 방문`, '페이지뷰 (PV)']}
                                            />
                                            <Bar
                                                dataKey="pv"
                                                fill="url(#barGoldGradient)"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={45}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                                <span>⚡ 한국표준시(KST) 24시간 실시간 트래픽</span>
                                <span className="text-primary font-medium">단위: 페이지뷰(PV)</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 우측 (5칸): 글로벌 16대 채널별 실제 유입 순위표 */}
                    <Card className="lg:col-span-5 bg-neutral-900/90 border-neutral-800 shadow-xl flex flex-col">
                        <CardHeader className="pb-3 border-b border-neutral-800/80">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                    <span>🌐 채널별 실제 유입 현황</span>
                                </CardTitle>
                                <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold border border-primary/30">
                                    {period === 'today' ? '오늘 24H' : period === 'weekly' ? '주간 7일' : period === 'monthly' ? '월간' : '연간'}
                                </span>
                            </div>
                            <CardDescription className="text-xs text-neutral-400 mt-1">
                                네이버, 구글, 틱톡, 카톡 등 어디서 들어왔는지 정밀 집계합니다.
                            </CardDescription>

                            {/* 채널 카테고리 필터 (KTRS 모델) */}
                            <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 text-xs">
                                <button
                                    onClick={() => setChannelCategoryFilter('all')}
                                    className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${channelCategoryFilter === 'all' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white bg-neutral-950'}`}
                                >
                                    전체
                                </button>
                                <button
                                    onClick={() => setChannelCategoryFilter('sns')}
                                    className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${channelCategoryFilter === 'sns' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white bg-neutral-950'}`}
                                >
                                    글로벌 SNS
                                </button>
                                <button
                                    onClick={() => setChannelCategoryFilter('messenger')}
                                    className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${channelCategoryFilter === 'messenger' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white bg-neutral-950'}`}
                                >
                                    메신저
                                </button>
                                <button
                                    onClick={() => setChannelCategoryFilter('search')}
                                    className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${channelCategoryFilter === 'search' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white bg-neutral-950'}`}
                                >
                                    포털/검색
                                </button>
                                <button
                                    onClick={() => setChannelCategoryFilter('community')}
                                    className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${channelCategoryFilter === 'community' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white bg-neutral-950'}`}
                                >
                                    블로그/커뮤니티
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-3 flex-grow overflow-y-auto max-h-[380px] space-y-2.5 pr-1">
                            {channelRankings.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500 text-xs">
                                    해당 카테고리의 유입 로그가 없습니다.
                                </div>
                            ) : (
                                channelRankings.map((ch, idx) => (
                                    <div
                                        key={ch.name}
                                        className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 hover:border-primary/40 transition-all flex items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {/* 순위 */}
                                            <span className={`text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                                idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-neutral-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-neutral-400'
                                            }`}>
                                                {idx + 1}
                                            </span>

                                            {/* 채널 아이콘 */}
                                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${ch.color} text-white shadow-sm`}>
                                                {ch.icon}
                                            </span>

                                            {/* 채널명 */}
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-neutral-200 truncate group-hover:text-primary transition-colors">
                                                    {ch.name}
                                                </p>
                                                <p className="text-[10px] text-neutral-500">
                                                    순방문자 {ch.uv}명
                                                </p>
                                            </div>
                                        </div>

                                        {/* 수치 & 프로그레스 */}
                                        <div className="text-right shrink-0">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="text-xs font-black text-white font-mono">{ch.pv}회</span>
                                                <span className="text-[10px] text-neutral-400 font-mono">({ch.percentage}%)</span>
                                            </div>
                                            <div className="w-20 bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden ml-auto">
                                                <div
                                                    className="bg-gradient-to-r from-primary to-amber-300 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.max(ch.percentage, ch.pv > 0 ? 5 : 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 5. 기존 회원 데이터 연동 (가입자 성비 및 통계) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <Card className="bg-neutral-900/60 border-neutral-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-400">총 등록 회원수</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-white font-mono">{users.length}명</div>
                            <p className="text-xs text-neutral-400 mt-1">Supabase DB 실시간 동기화</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/60 border-neutral-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-400">남녀 성비 균형 (50:50)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-bold text-white flex items-center justify-between">
                                <span className="text-sky-400">남성 {users.filter(u => u.gender === '남성').length}명</span>
                                <span className="text-neutral-500">/</span>
                                <span className="text-rose-400">여성 {users.filter(u => u.gender === '여성').length}명</span>
                            </div>
                            <div className="w-full bg-neutral-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
                                <div
                                    className="bg-sky-500 h-full transition-all"
                                    style={{ width: `${users.length > 0 ? (users.filter(u => u.gender === '남성').length / users.length) * 100 : 50}%` }}
                                />
                                <div
                                    className="bg-rose-500 h-full transition-all"
                                    style={{ width: `${users.length > 0 ? (users.filter(u => u.gender === '여성').length / users.length) * 100 : 50}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/60 border-neutral-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-neutral-400">최근 7일 신규 가입자</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-primary font-mono">
                                {users.filter(u => {
                                    if (!u.createdAt) return false;
                                    const d = new Date(u.createdAt as any);
                                    const diff = Date.now() - d.getTime();
                                    return diff <= 7 * 24 * 60 * 60 * 1000;
                                }).length}명
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">지난 일주일간 순수 가입</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
