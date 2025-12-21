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

type Props = {
  total: number | null;
  onDailyCheck: () => void;
  todayDaily: DailyRecord | null;
  onDetail: () => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  onShowHistory: () => void;
  onStartSMI: () => void;
  onStartPeriodInput: () => void;
  onOpenInsight: () => void;
  onOpenCommunity: () => void;
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
  onDetail,
  onSelectDate,   // ← 追加①
  selectedDate,   // ← 追加②
  onShowHistory,   // ← 追加③
  onStartSMI,      // ★追加する！
  onStartPeriodInput, // ← 追加
  onOpenInsight,     // ← ★ これを追加！
  onOpenCommunity,
  latestPeriod,
 }: Props) {
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

  // スコア表示用の安全な値（NaN対策）
  const safeTotal =
    typeof total === "number" && !Number.isNaN(total)
      ? Math.min(Math.max(total, 0), 100)
      : 0;

  const handleSelectDate = (date: string) => {
    onSelectDate(date);
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) {
      if (hasTodayRecord) {
        onDetail();
      } else {
        onDailyCheck();
      }
      return;
    }
    onDetail();
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-5">

        {/* あいさつ */}
        <div className="text-lg font-semibold text-center">
          こんにちは ユーザーさん
        </div>

        <CalendarGrid
          entries={calendarEntries}
          menstrualMarkers={menstrualMarkers}
          onOpenPeriodInput={onStartPeriodInput}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          initialMonth={initialMonth}
        />

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
