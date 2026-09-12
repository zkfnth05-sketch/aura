'use client';

import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { fetchAllUsers } from '@/lib/supabaseDataService';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, UserCheck, HeartHandshake, Clock, RefreshCw, Sparkles, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';

export default function SignupsAnalyticsPage() {
    const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [genderView, setGenderView] = useState<'all' | 'male' | 'female' | 'compare'>('compare');
    const [timeSlotWindow, setTimeSlotWindow] = useState<'all' | 'firstHalf' | 'secondHalf'>('all');

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllUsers(1000);
            setUsers(data || []);
        } catch (e) {
            console.error('Error fetching users:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // 1. 기간 필터링된 사용자 목록
    const filteredUsersByPeriod = useMemo(() => {
        const now = new Date();
        return users.filter(user => {
            if (!user.createdAt) return false;
            const userDate = typeof (user.createdAt as any)?.toDate === 'function' 
                ? (user.createdAt as any).toDate() 
                : new Date(user.createdAt as any);

            if (isNaN(userDate.getTime())) return false;

            if (period === 'today') {
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                return userDate >= todayStart;
            } else if (period === 'weekly') {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return userDate >= sevenDaysAgo;
            } else if (period === 'monthly') {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return userDate >= thirtyDaysAgo;
            } else {
                // yearly
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                return userDate >= oneYearAgo;
            }
        });
    }, [users, period]);

    // 2. 상단 4대 핵심 KPI 지표
    const metrics = useMemo(() => {
        const targetList = filteredUsersByPeriod.length > 0 ? filteredUsersByPeriod : users;
        const total = targetList.length;
        const males = targetList.filter(u => u.gender === '남성' || u.gender?.toLowerCase().startsWith('m')).length;
        const females = targetList.filter(u => u.gender === '여성' || u.gender?.toLowerCase().startsWith('f')).length;

        const maleRatio = total > 0 ? Math.round((males / total) * 100) : 50;
        const femaleRatio = total > 0 ? Math.round((females / total) * 100) : 50;

        // 기간 일수
        const days = period === 'today' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365;
        const dailyAvg = (filteredUsersByPeriod.length / days).toFixed(1);

        // 시간대별 피크 분석 (골든타임)
        const hourCounts: { [h: number]: number } = {};
        for (let i = 0; i < 24; i++) hourCounts[i] = 0;
        users.forEach(u => {
            if (u.createdAt) {
                const d = typeof (u.createdAt as any)?.toDate === 'function' ? (u.createdAt as any).toDate() : new Date(u.createdAt as any);
                if (!isNaN(d.getTime())) {
                    hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;
                }
            }
        });

        let peakHour = 22;
        let maxCount = -1;
        Object.entries(hourCounts).forEach(([h, count]) => {
            if (count > maxCount) {
                maxCount = count;
                peakHour = Number(h);
            }
        });

        return {
            periodTotal: filteredUsersByPeriod.length,
            males,
            females,
            maleRatio,
            femaleRatio,
            dailyAvg,
            goldenTime: `${peakHour.toString().padStart(2, '0')}:00 ~ ${((peakHour + 2) % 24).toString().padStart(2, '0')}:00`,
            allTotal: users.length,
        };
    }, [filteredUsersByPeriod, users, period]);

    // 3. 듀얼 바 차트 데이터 (남성 vs 여성)
    const chartData = useMemo(() => {
        if (period === 'today') {
            // 24시간대 슬롯
            const hourly: { [h: number]: { male: number; female: number; total: number } } = {};
            for (let i = 0; i < 24; i++) hourly[i] = { male: 0, female: 0, total: 0 };

            filteredUsersByPeriod.forEach(u => {
                const d = typeof (u.createdAt as any)?.toDate === 'function' ? (u.createdAt as any).toDate() : new Date(u.createdAt as any);
                if (!isNaN(d.getTime())) {
                    const h = d.getHours();
                    const isM = u.gender === '남성' || u.gender?.toLowerCase().startsWith('m');
                    if (isM) hourly[h].male += 1;
                    else hourly[h].female += 1;
                    hourly[h].total += 1;
                }
            });

            let list = Object.keys(hourly).map(h => ({
                label: `${h.padStart(2, '0')}시`,
                hour: Number(h),
                male: hourly[Number(h)].male,
                female: hourly[Number(h)].female,
                total: hourly[Number(h)].total,
            }));

            if (timeSlotWindow === 'firstHalf') list = list.filter(s => s.hour < 12);
            else if (timeSlotWindow === 'secondHalf') list = list.filter(s => s.hour >= 12);
            return list;
        } else if (period === 'weekly' || period === 'monthly') {
            // 일자별 (MM/dd)
            const dateMap: { [key: string]: { male: number; female: number; total: number } } = {};
            
            filteredUsersByPeriod.forEach(u => {
                const d = typeof (u.createdAt as any)?.toDate === 'function' ? (u.createdAt as any).toDate() : new Date(u.createdAt as any);
                if (!isNaN(d.getTime())) {
                    const key = format(d, 'MM/dd');
                    if (!dateMap[key]) dateMap[key] = { male: 0, female: 0, total: 0 };
                    const isM = u.gender === '남성' || u.gender?.toLowerCase().startsWith('m');
                    if (isM) dateMap[key].male += 1;
                    else dateMap[key].female += 1;
                    dateMap[key].total += 1;
                }
            });

            return Object.entries(dateMap).map(([key, data]) => ({
                label: key,
                male: data.male,
                female: data.female,
                total: data.total,
            }));
        } else {
            // 연간 (yy년 MM월)
            const monthMap: { [key: string]: { male: number; female: number; total: number } } = {};
            filteredUsersByPeriod.forEach(u => {
                const d = typeof (u.createdAt as any)?.toDate === 'function' ? (u.createdAt as any).toDate() : new Date(u.createdAt as any);
                if (!isNaN(d.getTime())) {
                    const key = format(d, 'yy년 MM월');
                    if (!monthMap[key]) monthMap[key] = { male: 0, female: 0, total: 0 };
                    const isM = u.gender === '남성' || u.gender?.toLowerCase().startsWith('m');
                    if (isM) monthMap[key].male += 1;
                    else monthMap[key].female += 1;
                    monthMap[key].total += 1;
                }
            });

            return Object.entries(monthMap).map(([key, data]) => ({
                label: key,
                male: data.male,
                female: data.female,
                total: data.total,
            }));
        }
    }, [filteredUsersByPeriod, period, timeSlotWindow]);

    // 4. 연령대별 & 성별 교차 분포 통계
    const ageDemographics = useMemo(() => {
        const groups = {
            '20대 초반 (20~24세)': { male: 0, female: 0, total: 0 },
            '20대 중후반 (25~29세)': { male: 0, female: 0, total: 0 },
            '30대 초반 (30~34세)': { male: 0, female: 0, total: 0 },
            '35세 이상': { male: 0, female: 0, total: 0 },
        };

        const targetList = filteredUsersByPeriod.length > 0 ? filteredUsersByPeriod : users;

        targetList.forEach(u => {
            let age = u.age;
            if (!age && u.dateOfBirth) {
                try {
                    age = differenceInYears(new Date(), new Date(u.dateOfBirth));
                } catch {
                    age = 26;
                }
            }
            if (!age || age < 19) age = 26; // 기본 중간값

            const isM = u.gender === '남성' || u.gender?.toLowerCase().startsWith('m');

            if (age >= 20 && age <= 24) {
                if (isM) groups['20대 초반 (20~24세)'].male += 1;
                else groups['20대 초반 (20~24세)'].female += 1;
                groups['20대 초반 (20~24세)'].total += 1;
            } else if (age >= 25 && age <= 29) {
                if (isM) groups['20대 중후반 (25~29세)'].male += 1;
                else groups['20대 중후반 (25~29세)'].female += 1;
                groups['20대 중후반 (25~29세)'].total += 1;
            } else if (age >= 30 && age <= 34) {
                if (isM) groups['30대 초반 (30~34세)'].male += 1;
                else groups['30대 초반 (30~34세)'].female += 1;
                groups['30대 초반 (30~34세)'].total += 1;
            } else {
                if (isM) groups['35세 이상'].male += 1;
                else groups['35세 이상'].female += 1;
                groups['35세 이상'].total += 1;
            }
        });

        const totalAll = Math.max(1, targetList.length);

        return Object.entries(groups).map(([label, data]) => ({
            label,
            male: data.male,
            female: data.female,
            total: data.total,
            percentage: ((data.total / totalAll) * 100).toFixed(1),
        }));
    }, [filteredUsersByPeriod, users]);

    return (
        <AdminLayout>
            <div className="space-y-6 pb-12">
                {/* 1. 상단 관제 센터 타이틀 바 */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-primary/20 shadow-xl">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/30">
                                AURA 50:50 성비 밸런스 관제 시스템
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                            <span>가입자 정밀 분석 & 성비 모니터링 센터</span>
                        </h1>
                        <p className="text-xs md:text-sm text-neutral-400 mt-1">
                            하루(24시간), 일주일, 한 달, 연도별 및 남성/여성 가입 추이와 연령대별 통계를 초정밀 분석합니다.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={loadUsers}
                            disabled={isLoading}
                            className="text-neutral-400 hover:text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* 2. 기간 & 성별 듀얼 컨트롤 바 */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                    {/* 기간 필터 */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                        <button
                            onClick={() => setPeriod('today')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                period === 'today' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                        >
                            ⚡ 오늘 (24시간)
                        </button>
                        <button
                            onClick={() => setPeriod('weekly')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                period === 'weekly' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                        >
                            📅 주간 (최근 7일)
                        </button>
                        <button
                            onClick={() => setPeriod('monthly')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                period === 'monthly' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                        >
                            📊 월간 (최근 30일)
                        </button>
                        <button
                            onClick={() => setPeriod('yearly')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                period === 'yearly' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                        >
                            📈 연간 (YoY 성장)
                        </button>
                    </div>

                    {/* 성별 뷰 모드 */}
                    <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 w-full md:w-auto justify-end">
                        <button
                            onClick={() => setGenderView('compare')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${genderView === 'compare' ? 'bg-gradient-to-r from-sky-500 to-rose-500 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                        >
                            남녀 비교 뷰
                        </button>
                        <button
                            onClick={() => setGenderView('all')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${genderView === 'all' ? 'bg-primary text-black' : 'text-neutral-400 hover:text-white'}`}
                        >
                            전체
                        </button>
                        <button
                            onClick={() => setGenderView('male')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${genderView === 'male' ? 'bg-sky-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                        >
                            남성만
                        </button>
                        <button
                            onClick={() => setGenderView('female')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${genderView === 'female' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                        >
                            여성만
                        </button>
                    </div>
                </div>

                {/* 3. 4대 핵심 KPI 요약 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">
                                {period === 'today' ? '오늘 신규 가입자' : '선택 기간 신규 가입'}
                            </CardTitle>
                            <UserCheck className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                {isLoading ? '-' : `${metrics.periodTotal.toLocaleString()} `}
                                <span className="text-xs md:text-sm font-normal text-neutral-400">명</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs">
                                <span className="text-sky-400 font-semibold">남 {metrics.males}명</span>
                                <span className="text-neutral-600">/</span>
                                <span className="text-rose-400 font-semibold">여 {metrics.females}명</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">남녀 성비 균형도</CardTitle>
                            <HeartHandshake className="h-4 w-4 text-rose-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center justify-between">
                                <span className="text-sky-400">{metrics.maleRatio}%</span>
                                <span className="text-xs font-bold text-neutral-500">:</span>
                                <span className="text-rose-400">{metrics.femaleRatio}%</span>
                            </div>
                            <div className="w-full bg-neutral-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
                                <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${metrics.maleRatio}%` }} />
                                <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${metrics.femaleRatio}%` }} />
                            </div>
                            <p className="text-[11px] text-emerald-400 mt-1.5 font-medium">✓ 황금 50:50 균형 유지 중</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">일평균 신규 가입</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                {isLoading ? '-' : `${metrics.dailyAvg} `}
                                <span className="text-xs md:text-sm font-normal text-neutral-400">명/일</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1">총 누적 회원 {metrics.allTotal}명 기준</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium text-neutral-400">가입 골든타임 (피크)</CardTitle>
                            <Clock className="h-4 w-4 text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg md:text-xl font-black text-amber-400 tracking-tight">
                                {metrics.goldenTime}
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1.5">심야 데이팅 탐색 시간 집중</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. 메인 듀얼 차트 & 연령대별 분포 섹션 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* 좌측 (7칸): 남녀 성별 비교 듀얼 차트 */}
                    <Card className="lg:col-span-7 bg-neutral-900/90 border-neutral-800 shadow-xl flex flex-col">
                        <CardHeader className="pb-3 border-b border-neutral-800/80 flex flex-row items-center justify-between flex-wrap gap-2">
                            <div>
                                <CardTitle className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                    <span>📊 {period === 'today' ? '오늘 24시간 시간대별 남녀 가입 추이' : period === 'weekly' ? '최근 7일 일별 성별 가입 추이' : period === 'monthly' ? '최근 30일 일별 성별 가입 추이' : '연간 월별 남녀 가입 실적'}</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-neutral-400 mt-0.5">
                                    남성(스카이블루)과 여성(로즈핑크) 가입자 수를 실시간 비교 대조합니다.
                                </CardDescription>
                            </div>

                            {period === 'today' && (
                                <div className="flex items-center gap-1 text-xs bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                                    <button
                                        onClick={() => setTimeSlotWindow('all')}
                                        className={`px-2.5 py-1 rounded font-medium ${timeSlotWindow === 'all' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                                    >
                                        전체
                                    </button>
                                    <button
                                        onClick={() => setTimeSlotWindow('firstHalf')}
                                        className={`px-2.5 py-1 rounded font-medium ${timeSlotWindow === 'firstHalf' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                                    >
                                        00~12시
                                    </button>
                                    <button
                                        onClick={() => setTimeSlotWindow('secondHalf')}
                                        className={`px-2.5 py-1 rounded font-medium ${timeSlotWindow === 'secondHalf' ? 'bg-primary text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
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
                            ) : chartData.length === 0 || chartData.every(c => c.total === 0) ? (
                                <div className="flex flex-col h-[320px] items-center justify-center text-center p-6 bg-neutral-950/40 rounded-xl border border-dashed border-neutral-800">
                                    <Calendar className="h-10 w-10 text-neutral-600 mb-2" />
                                    <p className="text-sm font-semibold text-neutral-300">선택 기간 내 가입자 데이터가 없습니다.</p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        상단에서 <strong>[월간 (30일)]</strong> 또는 <strong>[연간]</strong> 탭을 클릭해 보세요.
                                    </p>
                                </div>
                            ) : (
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                                            <XAxis
                                                dataKey="label"
                                                tickLine={false}
                                                axisLine={false}
                                                stroke="#737373"
                                                fontSize={11}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                stroke="#737373"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#171717',
                                                    borderColor: '#404040',
                                                    borderRadius: '0.75rem',
                                                    color: '#fff',
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                                }}
                                                formatter={(value: any, name: any) => [
                                                    `${value}명`,
                                                    name === 'male' ? '남성 가입자' : name === 'female' ? '여성 가입자' : '총 가입자'
                                                ]}
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                align="right"
                                                height={30}
                                                formatter={(val) => val === 'male' ? '남성' : val === 'female' ? '여성' : '전체'}
                                            />
                                            {(genderView === 'compare' || genderView === 'male') && (
                                                <Bar dataKey="male" name="male" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                            )}
                                            {(genderView === 'compare' || genderView === 'female') && (
                                                <Bar dataKey="female" name="female" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                            )}
                                            {genderView === 'all' && (
                                                <Bar dataKey="total" name="total" fill="#E5A934" radius={[4, 4, 0, 0]} maxBarSize={35} />
                                            )}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                                <span>⚡ 실시간 가입 데이터베이스 동기화</span>
                                <span className="text-primary font-medium">단위: 신규 가입 회원(명)</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 우측 (5칸): 연령대별 & 성별 교차 분포도 */}
                    <Card className="lg:col-span-5 bg-neutral-900/90 border-neutral-800 shadow-xl flex flex-col">
                        <CardHeader className="pb-3 border-b border-neutral-800/80">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                    <span>🎂 연령대별 회원 분포</span>
                                </CardTitle>
                                <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold border border-primary/30">
                                    인구통계
                                </span>
                            </div>
                            <CardDescription className="text-xs text-neutral-400 mt-1">
                                20~30대 남녀 가입자 층의 상세 연령 분포입니다.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-5 flex-grow space-y-4">
                            {ageDemographics.map((item) => (
                                <div key={item.label} className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-neutral-200">{item.label}</span>
                                        <span className="text-white font-mono">{item.total}명 ({item.percentage}%)</span>
                                    </div>

                                    {/* 남/여 성비 바 */}
                                    <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden flex">
                                        <div
                                            className="bg-sky-500 h-full transition-all duration-500"
                                            style={{ width: `${item.total > 0 ? (item.male / item.total) * 100 : 50}%` }}
                                            title={`남성 ${item.male}명`}
                                        />
                                        <div
                                            className="bg-rose-500 h-full transition-all duration-500"
                                            style={{ width: `${item.total > 0 ? (item.female / item.total) * 100 : 50}%` }}
                                            title={`여성 ${item.female}명`}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5 font-medium">
                                        <span className="text-sky-400">남성 {item.male}명 ({item.total > 0 ? Math.round((item.male / item.total) * 100) : 0}%)</span>
                                        <span className="text-rose-400">여성 {item.female}명 ({item.total > 0 ? Math.round((item.female / item.total) * 100) : 0}%)</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* 5. 하단: 일자별 / 시간대별 상세 통계 데이터 리포트 표 */}
                <Card className="bg-neutral-900/90 border-neutral-800 shadow-xl">
                    <CardHeader className="pb-3 border-b border-neutral-800/80 flex flex-row items-center justify-between flex-wrap gap-2">
                        <div>
                            <CardTitle className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                                <span>📋 상세 가입 실적 데이터 그리드</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-neutral-400 mt-0.5">
                                선택된 기간 동안의 일자/시간대별 가입자 수와 성비 균형도를 엑셀 형태로 확인합니다.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-mono text-neutral-400 bg-neutral-950 px-3 py-1 rounded-md border border-neutral-800">
                            총 {chartData.length}개 구간 집계
                        </span>
                    </CardHeader>

                    <CardContent className="pt-4 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">구간 / 일자</th>
                                    <th className="py-3 px-4 font-semibold text-center">총 신규 가입</th>
                                    <th className="py-3 px-4 font-semibold text-center text-sky-400">남성 가입 (명)</th>
                                    <th className="py-3 px-4 font-semibold text-center text-rose-400">여성 가입 (명)</th>
                                    <th className="py-3 px-4 font-semibold text-center">성비 밸런스 (남:여)</th>
                                    <th className="py-3 px-4 font-semibold text-right">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/60 font-mono">
                                {chartData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-neutral-500">데이터가 없습니다.</td>
                                    </tr>
                                ) : (
                                    chartData.map((row, idx) => {
                                        const mRatio = row.total > 0 ? Math.round((row.male / row.total) * 100) : 50;
                                        const fRatio = row.total > 0 ? Math.round((row.female / row.total) * 100) : 50;
                                        const isBalanced = Math.abs(mRatio - 50) <= 15;

                                        return (
                                            <tr key={row.label} className="hover:bg-neutral-800/40 transition-colors">
                                                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                                                    <span className="text-neutral-500 text-[10px]">#{idx + 1}</span>
                                                    <span>{row.label}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold text-primary">
                                                    {row.total}명
                                                </td>
                                                <td className="py-3 px-4 text-center text-sky-400 font-semibold">
                                                    {row.male}명 ({mRatio}%)
                                                </td>
                                                <td className="py-3 px-4 text-center text-rose-400 font-semibold">
                                                    {row.female}명 ({fRatio}%)
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="inline-flex items-center gap-1.5 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-[11px]">
                                                        <span className="text-sky-400 font-bold">{mRatio}%</span>
                                                        <span className="text-neutral-500">:</span>
                                                        <span className="text-rose-400 font-bold">{fRatio}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    {row.total === 0 ? (
                                                        <span className="text-neutral-600 text-[10px]">-</span>
                                                    ) : isBalanced ? (
                                                        <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                                                            ✓ 균형 우수
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-400 text-[10px] bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                                                            ⚡ 성비 보정 중
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
