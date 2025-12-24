import React, { useEffect, useMemo, useState } from "react";
import { DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { generateAdvice } from "../logic/adviceLogic";
import Card from "../components/layout/Card";
import SectionTitle from "../components/layout/SectionTitle";
import CalendarGrid from "../components/calendar/CalendarGrid";
import { buildCalendarEntries } from "../utils/calendarEntries";
import WeatherCard from "../components/weather/WeatherCard";
import CommunityPreviewCard from "../components/community/CommunityPreviewCard";
import { fetchWeather, WeatherData, WeatherError } from "../api/weather";
import { loadMenstrualMarkers } from "../logic/calendar/menstrualMarkers";
import { generateNurseAdvice } from "../logic/advice/nurseAdvice";
import { useStorage } from "../hooks/useStorage";
import { predictNextPeriod, PredictionResult } from "../logic/core/periodPrediction";

type Props = {
  total: number | null;
  onDailyCheck: () => void;
  todayDaily: DailyRecord | null;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  onShowHistory: () => void;
  onStartSMI: () => void;
  onStartPeriodInput: () => void;
  onOpenInsight: () => void;
  onOpenCommunity: () => void;
  onOpenSettings: () => void;
  latestPeriod: PeriodRecord | null;
};

function loadDailyRecords(): DailyRecord[] {
  if (typeof localStorage === "undefined") return [];
  const list: DailyRecord[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("haru_daily_")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as DailyRecord;
        list.push(parsed);
      } catch {
        // ignore malformed
      }
    }
  } catch {
    return [];
  }

  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function buildSummaryText(preferred?: string | null, fallback?: string | null) {
  // まず改行・余分なスペースを除去（ここが最重要）
  const raw = (preferred || fallback || "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return null;

  // 文ごとに分割（句点・!・? など）
  const sentences =
    raw.match(/[^。．!！?？]+[。．!！?？]?/g) || [raw];

  // 最初の 1〜2 文だけ取る
  let summary = sentences.slice(0, 2).join("").trim();

  // 長すぎる場合は切る
  if (summary.length > 120) {
    summary = summary.slice(0, 120) + "…";
  }

  return summary;
}

// ▽ Dashboard 本体
export default function DashboardScreen({ 
  total, 
  onDailyCheck, 
  todayDaily, 
  onSelectDate,   // ← 追加①
  selectedDate,   // ← 追加②
  onShowHistory,   // ← 追加③
  onStartSMI,      // ★追加する！
  onStartPeriodInput, // ← 追加
  onOpenInsight,     // ← ★ これを追加！
  onOpenCommunity,
  onOpenSettings,
  latestPeriod,
 }: Props) {
  const storage = useStorage();
  const [username, setUsername] = useState("ユーザー");
  const [periodPrediction, setPeriodPrediction] = useState<PredictionResult | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasTodayRecord = Boolean(
    todayDaily && todayDaily.date === todayStr && todayDaily.answers
  );

  const advice = todayDaily?.answers
    ? generateAdvice(todayDaily.answers)
    : null;

  const calendarEntries = useMemo(
    () => buildCalendarEntries(loadDailyRecords()),
    [todayDaily, selectedDate]
  );

  const menstrualMarkers = useMemo(
    () => loadMenstrualMarkers(),
    [selectedDate, latestPeriod]
  );

  const initialMonth = selectedDate ? new Date(selectedDate) : new Date();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<WeatherError | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);

  const nurseAdvice = useMemo(() => {
    if (!todayDaily?.answers || !weatherData) return null;
    return generateNurseAdvice(weatherData, todayDaily.answers);
  }, [todayDaily, weatherData]);

  const summaryAdvice = useMemo(() => {
    if (!hasTodayRecord) return null;
    return buildSummaryText(nurseAdvice, advice);
  }, [advice, nurseAdvice, hasTodayRecord]);

  const formatJPDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return dateStr;
    return `${y}年${m}月${d}日`;
  };

  useEffect(() => {
    let isMounted = true;
    setWeatherLoading(true);
    fetchWeather(43.0667, 141.35)
      .then((data) => {
        if (!isMounted) return;
        if ("temperature_2m" in data) {
          setWeatherData(data);
          setWeatherError(null);
        } else {
          setWeatherData(null);
          setWeatherError(data);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setWeatherData(null);
        setWeatherError({
          message:
            err instanceof Error ? err.message : "天気の取得に失敗しました",
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setWeatherLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await storage.loadProfile();
      if (profile?.nickname) {
        setUsername(profile.nickname);
      }
    };
    loadProfile();
  }, [storage]);

  useEffect(() => {
    const loadPrediction = async () => {
      const history = await storage.loadAllPeriods();
      const result = predictNextPeriod(history);
      setPeriodPrediction(result);
    };
    loadPrediction();
  }, [storage, latestPeriod]); // latestPeriodが変わったら再計算

  // スコア表示用の安全な値（NaN対策）
  const safeTotal =
    typeof total === "number" && !Number.isNaN(total)
      ? Math.min(Math.max(total, 0), 100)
      : 0;

  const handleSelectDate = (date: string) => {
    onSelectDate(date);
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-5">

        {/* あいさつ */}
        <div className="relative flex items-center justify-center">
          <div className="text-lg font-semibold">
            こんにちは {username}さん
          </div>
          <button
            onClick={onOpenSettings}
            className="absolute right-0 p-2 text-brandMuted hover:text-brandAccent transition-colors"
            aria-label="設定"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <CalendarGrid
          entries={calendarEntries}
          menstrualMarkers={menstrualMarkers}
          onOpenPeriodInput={onStartPeriodInput}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          initialMonth={initialMonth}
        />

        {/* 生理予測カード */}
        {periodPrediction && periodPrediction.nextPeriodDate && (
          <Card className="p-4 flex items-center justify-between shadow-sm border border-brandAccentAlt/20">
            <div>
              <div className="text-xs text-brandMuted mb-1">次の生理予定日</div>
              <div className="text-lg font-bold text-brandText">
                {formatJPDate(periodPrediction.nextPeriodDate)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-brandMuted mb-1">あと</div>
              <div className="text-xl font-bold text-brandAccent">
                {periodPrediction.daysUntilNext !== null && periodPrediction.daysUntilNext < 0
                  ? "予定日超過"
                  : periodPrediction.daysUntilNext}
                <span className="text-sm text-brandText font-normal ml-1">日</span>
              </div>
            </div>
          </Card>
        )}

        {/* 現在の更年期指数カード（円グラフ） */}
        <Card
          as="button"
          onClick={onStartSMI}
          className="text-center w-full p-3 space-y-1"
        >
          <div className="text-sm mt-1">現在の更年期指数</div>

          <div className="relative w-[120px] h-[120px] mx-auto">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-brandTrack"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
              />
              <path
                className="text-brandAccent"
                strokeWidth="3.5"
                strokeDasharray={`${(safeTotal / 100) * 100}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-brandTextStrong">
              {total != null ? total : "—"}
            </div>
          </div>

          <div className="text-xs text-brandMuted">
            現在の更年期指数から0日経過
          </div>
        </Card>

        {/* 今日の総合アドバイスカード */}
        <Card className="py-7 px-6 shadow-md">
          <div className="mb-2">
            <SectionTitle className="mb-1">🔮 今日の総合アドバイス</SectionTitle>

            <div className="text-[11px] text-brandMuted mb-1">
              Summary for Today
            </div>

            <div className="text-xs text-brandMuted">
              📅 {formatJPDate(selectedDate)} のアドバイス
            </div>
          </div>

          {hasTodayRecord && summaryAdvice ? (
            <div className="my-2">
              <div className="bg-brandAccentAlt/20 rounded-lg px-3 py-2 text-sm leading-relaxed text-brandText">
                {summaryAdvice}
              </div>
            </div>
          ) : (
            <div className="text-sm text-brandMuted my-2 leading-relaxed">
              今日の体調はいかがですか？<br />
              今日も無理せず過ごしてくださいね。
            </div>
          )}

          <div className="border-t border-brandAccentAlt pt-3 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInsight();
              }}
              className="text-xs text-brandAccent underline hover:opacity-80 transition-opacity"
            >
              → 詳しく見る
            </button>
          </div>
        </Card>

        <WeatherCard
          data={weatherLoading ? null : weatherData}
          error={weatherError}
        />

        <CommunityPreviewCard onOpen={onOpenCommunity} />
      </div>
    </div>
  );
}
