import React, { useEffect, useMemo, useState } from "react";
import { DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { generateAdvice } from "../logic/adviceLogic";
import Card from "../components/layout/Card";
import CalendarGrid from "../components/calendar/CalendarGrid";
import { buildCalendarEntries } from "../utils/calendarEntries";
import WeatherCard from "../components/weather/WeatherCard";
import CommunityPreviewCard from "../components/community/CommunityPreviewCard";
import { fetchWeather, WeatherData, WeatherError } from "../api/weather";
import { generateHaruAdvice } from "../logic/advice/haruAdvice";
import { useStorage } from "../hooks/useStorage";
import { predictNextPeriod, PredictionResult, getCyclePhase, PhaseInfo } from "../logic/core/periodPrediction";

// ▼ フェーズごとのスタイルとアドバイス定義
const PHASE_STYLES: Record<string, { label: string; color: string; advice: string }> = {
  menstrual: {
    label: "月経期",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    advice: "無理せず体を温めてリラックス。",
  },
  follicular: {
    label: "卵胞期",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    advice: "心身ともに好調！新しい挑戦を。",
  },
  ovulation: {
    label: "排卵期",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    advice: "前向きな気持ちで過ごせそう。",
  },
  luteal: {
    label: "黄体期",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    advice: "むくみやイライラに注意して。",
  },
};

type Props = {
  total: number | null;
  onDailyCheck: () => void;
  todayDaily: DailyRecord | null;
  historyRecords: DailyRecord[];
  onSelectDate: (date: string) => void;
  selectedDate: string;
  onShowHistory: () => void;
  onOpenSMIHistory: () => void;
  onOpenInsight: () => void;
  onOpenCommunity: () => void;
  onOpenSettings: () => void;
  latestPeriod: PeriodRecord | null;
};

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
  historyRecords,
  onSelectDate,
  selectedDate,
  onShowHistory,
  onOpenSMIHistory,
  onOpenInsight,
  onOpenCommunity,
  onOpenSettings,
  latestPeriod,
 }: Props) {
  const storage = useStorage();
  const [username, setUsername] = useState("ユーザー");
  const [periodPrediction, setPeriodPrediction] = useState<PredictionResult | null>(null);
  const [currentPhase, setCurrentPhase] = useState<PhaseInfo | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const hasTodayRecord = Boolean(
    todayDaily && todayDaily.date === todayStr && todayDaily.answers
  );

  const advice = todayDaily?.answers
    ? generateAdvice(todayDaily.answers)
    : null;

  const calendarEntries = useMemo(
    () => buildCalendarEntries(historyRecords),
    [historyRecords]
  );

  // ▼ カレンダー連携用データの準備
  // 将来的に CalendarGrid に排卵日予測などを渡すためにデータを整形
  const predictionForCalendar = useMemo(() => {
    if (!periodPrediction) return null;
    return {
      nextPeriodDate: periodPrediction.nextPeriodDate,
      // PredictionResult に nextOvulationDate が含まれていると仮定、または計算ロジックを追加
      // nextOvulationDate: periodPrediction.nextOvulationDate, 
    };
  }, [periodPrediction]);

  const initialMonth = selectedDate ? new Date(selectedDate) : new Date();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<WeatherError | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);

  const haruAdvice = useMemo(() => {
    if (!todayDaily?.answers || !weatherData) return null;
    return generateHaruAdvice(weatherData, todayDaily.answers);
  }, [todayDaily, weatherData]);

  const summaryAdvice = useMemo(() => {
    if (!hasTodayRecord) return null;
    return buildSummaryText(haruAdvice, advice);
  }, [advice, haruAdvice, hasTodayRecord]);

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

  // ▼ 最新の生理記録から現在のフェーズを計算
  useEffect(() => {
    if (latestPeriod) {
      const info = getCyclePhase(latestPeriod.start);
      setCurrentPhase(info);
    } else {
      setCurrentPhase(null);
    }
  }, [latestPeriod]);

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
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          initialMonth={initialMonth}
          // prediction={predictionForCalendar} // 将来的にカレンダー側が対応したら有効化
        />

        {/* 現在の更年期指数カード（円グラフ） ※カレンダー直下に移動 */}
        <Card
          as="button"
          onClick={onOpenSMIHistory}
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
            <span className="text-brandAccent font-semibold">詳しくはこちら ＞</span>
          </div>
        </Card>

        {/* 今日のサマリーカード（生理予測とアドバイスを統合） */}
        <Card
          as="button"
          onClick={onOpenInsight}
          className="w-full text-left p-4 shadow-sm border border-brandAccentAlt/20 flex flex-col gap-4 hover:bg-gray-50 transition-colors"
        >
          {/* 上段：生理予測情報（データがある場合のみ） */}
          {periodPrediction && periodPrediction.nextPeriodDate && (
            <>
              <div className="flex items-center justify-between">
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
              </div>

              {/* 中段：フェーズ情報 */}
              {currentPhase && PHASE_STYLES[currentPhase.phase] && (
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${PHASE_STYLES[currentPhase.phase].color}`}>
                    {PHASE_STYLES[currentPhase.phase].label}
                  </span>
                  <span className="text-xs text-brandText">
                    {PHASE_STYLES[currentPhase.phase].advice}
                  </span>
                </div>
              )}

              <div className="border-t border-dashed border-brandAccentAlt/30" />
            </>
          )}

          {/* 下段：今日の総合アドバイス */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-brandMuted">今日の総合アドバイス</div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-brandMuted">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>

            {hasTodayRecord && summaryAdvice ? (
              <div className="text-sm leading-relaxed text-brandText">
                {summaryAdvice}
              </div>
            ) : (
              <div className="text-sm text-brandMuted leading-relaxed">
                今日の体調はいかがですか？<br />
                今日も無理せず過ごしてくださいね。
              </div>
            )}
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
