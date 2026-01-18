import { useMemo } from "react";
import { DailyRecord } from "../types/daily";
import { calculateDailyScore } from "../logic/insightLogic";

export type InsightChartData = {
  date: string;
  fullDate: string;
  temp: number | null;
  memo: string | undefined;
  isPeriod: boolean | undefined;
};

export type WeeklyReportData = {
  timeline: {
    date: string;
    dayLabel: string;
    isPeriod: boolean | undefined;
    hospital: boolean;
    medication: boolean;
    hasRecord: boolean;
  }[];
  ranking: string[];
  averageScore: number | null;
  recordCount: number;
};

export type MonthlyReportData = {
  calendarDays: {
    date: string;
    day: number;
    dayOfWeek: number;
    record: DailyRecord | undefined;
    score: number | null;
    temp: number | null;
    isPeriod: boolean | undefined;
    hospital: boolean;
    medication: boolean;
  }[];
  avgScore: number | null;
  lastMonthAvg: number | null;
  tempStats: {
    count: number;
    max: number | null;
    min: number | null;
    avg: string | null;
  };
  year: number;
  month: number;
  ranking: { key: string; trend: "up" | "down" | "same" }[];
};

export const useInsightData = (dailyHistory: DailyRecord[], todayDaily: DailyRecord | null) => {
  const todayLabel = todayDaily?.date ?? new Date().toISOString().slice(0, 10);

  // -------------------------
  // グラフ用データの準備 (DailyReport用)
  // -------------------------
  const sortedHistory = useMemo(() => {
    return [...dailyHistory].sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [dailyHistory]);

  const chartData: InsightChartData[] = useMemo(() => {
    return sortedHistory.map((r) => ({
      date: r.date.slice(5).replace("-", "/"), // MM/DD
      fullDate: r.date,
      temp: r.answers.temperature ? parseFloat(r.answers.temperature) : null,
      memo: r.memo,
      isPeriod: r.isPeriod,
    }));
  }, [sortedHistory]);

  const periodRanges = useMemo(() => {
    const ranges: { start: string; end: string }[] = [];
    let currentStart: string | null = null;
    let lastDate: string | null = null;

    chartData.forEach((d) => {
      if (d.isPeriod) {
        if (!currentStart) currentStart = d.date;
        lastDate = d.date;
      } else {
        if (currentStart && lastDate) {
          ranges.push({ start: currentStart, end: lastDate });
          currentStart = null;
          lastDate = null;
        }
      }
    });
    if (currentStart && lastDate) {
      ranges.push({ start: currentStart, end: lastDate });
    }
    return ranges;
  }, [chartData]);

  // -------------------------
  // 週次レポート用データ計算
  // -------------------------
  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); 
    const diffToMon = day === 0 ? -6 : 1 - day; 
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon);
    
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  const weeklyData: WeeklyReportData = useMemo(() => {
    const recordsMap = new Map<string, DailyRecord>();
    dailyHistory.forEach(r => recordsMap.set(r.date, r));

    const timeline = weekDates.map(date => {
      const record = recordsMap.get(date);
      const dayLabel = ["日", "月", "火", "水", "木", "金", "土"][new Date(date).getDay()];
      return {
        date,
        dayLabel,
        isPeriod: record?.isPeriod,
        hospital: record?.answers?.hospital_visit === "true",
        medication: record?.answers?.medication_change === "true",
        hasRecord: !!record,
      };
    });

    const symptomCounts: Record<string, number> = {};
    let totalScore = 0;
    let recordCount = 0;

    weekDates.forEach(date => {
      const record = recordsMap.get(date);
      if (!record) return;

      recordCount++;
      
      let dailyScore = 100;
      Object.entries(record.answers).forEach(([key, value]) => {
        if (["temperature", "bleeding", "hospital_visit", "medication_change", "blood_test_note"].includes(key)) return;
        
        let weight = 0;
        if (value === "強い") { weight = 3; dailyScore -= 15; }
        else if (value === "中くらい") { weight = 2; dailyScore -= 10; }
        else if (value === "弱い") { weight = 1; dailyScore -= 5; }
        
        if (weight > 0) symptomCounts[key] = (symptomCounts[key] || 0) + weight;
      });
      totalScore += Math.max(0, dailyScore);
    });

    const ranking = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key);

    const averageScore = recordCount > 0 ? Math.round(totalScore / recordCount) : null;

    return { timeline, ranking, averageScore, recordCount };
  }, [weekDates, dailyHistory]);

  // -------------------------
  // 月次レポート用データ計算
  // -------------------------
  const monthlyData: MonthlyReportData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    
    const dates: string[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${da}`);
    }

    const recordsMap = new Map<string, DailyRecord>();
    dailyHistory.forEach(r => recordsMap.set(r.date, r));

    const calendarDays = dates.map(date => {
      const record = recordsMap.get(date);
      const d = new Date(date);
      return {
        date,
        day: d.getDate(),
        dayOfWeek: d.getDay(),
        record,
        score: record ? calculateDailyScore(record) : null,
        temp: record?.answers.temperature ? parseFloat(record.answers.temperature) : null,
        isPeriod: record?.isPeriod,
        hospital: record?.answers?.hospital_visit === "true",
        medication: record?.answers?.medication_change === "true",
      };
    });

    const scores = calendarDays.map(d => d.score).filter((s): s is number => s !== null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    const lastMonthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const lastMonthEnd = new Date(year, month, 0).toISOString().slice(0, 10);
    const lastMonthScores = dailyHistory
      .filter(r => r.date >= lastMonthStart && r.date <= lastMonthEnd)
      .map(r => calculateDailyScore(r));
    const lastMonthAvg = lastMonthScores.length > 0 
      ? Math.round(lastMonthScores.reduce((a, b) => a + b, 0) / lastMonthScores.length) 
      : null;

    const temps = calendarDays.map(d => d.temp).filter((t): t is number => t !== null && !isNaN(t));
    const tempStats = {
      count: temps.length,
      max: temps.length > 0 ? Math.max(...temps) : null,
      min: temps.length > 0 ? Math.min(...temps) : null,
      avg: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2) : null,
    };

    const calculateSymptoms = (records: DailyRecord[]) => {
      const counts: Record<string, number> = {};
      records.forEach(record => {
        Object.entries(record.answers).forEach(([key, value]) => {
          if (["temperature", "bleeding", "hospital_visit", "medication_change", "blood_test_note"].includes(key)) return;
          
          let weight = 0;
          if (value === "強い") weight = 3;
          else if (value === "中くらい") weight = 2;
          else if (value === "弱い") weight = 1;
          
          if (weight > 0) counts[key] = (counts[key] || 0) + weight;
        });
      });
      return counts;
    };

    const currentMonthRecords = calendarDays.map(d => d.record).filter((r): r is DailyRecord => !!r);
    const currentSymptoms = calculateSymptoms(currentMonthRecords);

    const lastMonthRecords = dailyHistory.filter(r => r.date >= lastMonthStart && r.date <= lastMonthEnd);
    const lastMonthSymptoms = calculateSymptoms(lastMonthRecords);

    const ranking = Object.entries(currentSymptoms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, score]) => {
        const lastScore = lastMonthSymptoms[key] || 0;
        let trend: "up" | "down" | "same" = "same";
        if (score > lastScore) trend = "up";
        else if (score < lastScore) trend = "down";
        return { key, trend };
      });

    return {
      calendarDays,
      avgScore,
      lastMonthAvg,
      tempStats,
      year,
      month: month + 1,
      ranking,
    };
  }, [dailyHistory]);

  return {
    todayLabel,
    chartData,
    periodRanges,
    weekDates,
    weeklyData,
    monthlyData,
  };
};