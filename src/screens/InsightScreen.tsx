import React, { useEffect, useMemo, useState } from "react";
import { DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { generateNurseAdvice } from "../logic/advice/nurseAdvice";
import { getOrGenerateRecipe } from "../logic/advice/recipeSuggestion";
import { fetchWeather, WeatherData, WeatherError } from "../api/weather";
import { useStorage } from "../hooks/useStorage";
import { SMIRecord } from "../types/smi";
import { getCyclePhase, PhaseInfo } from "../logic/core/periodPrediction";
import { useInsightData } from "../hooks/useInsightData"; // パス確認: src/hooks/useInsightData.ts
import DailyReport from "../components/insight/DailyReport"; // パス確認: src/components/insight/DailyReport.tsx
import WeeklyReport from "../components/insight/WeeklyReport"; // パス確認: src/components/insight/WeeklyReport.tsx
import MonthlyReport from "../components/insight/MonthlyReport"; // パス確認: src/components/insight/MonthlyReport.tsx

type Props = {
  todayDaily: DailyRecord | null;
  onBack: () => void;
  latestPeriod?: PeriodRecord | null;
  allDailyRecords?: DailyRecord[];
};

export default function InsightScreen({ todayDaily, onBack, latestPeriod, allDailyRecords }: Props) {
  const storage = useStorage();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<WeatherError | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [recipeLoading, setRecipeLoading] = useState<boolean>(false);
  const [smiHistory, setSmiHistory] = useState<SMIRecord[]>([]);
  const [dailyHistory, setDailyHistory] = useState<DailyRecord[]>([]);
  const [phaseInfo, setPhaseInfo] = useState<PhaseInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");

  // カスタムフックでデータ計算
  const { todayLabel, chartData, periodRanges, weekDates, weeklyData, monthlyData } = useInsightData(dailyHistory, todayDaily);

  // -------------------------
  // 天気データ取得
  // -------------------------
  useEffect(() => {
    let isMounted = true;
    setWeatherLoading(true);

    fetchWeather(43.0667, 141.35)
      .then((data) => {
        if (!isMounted) return;
        if ("message" in data) {
          setWeatherData(null);
          setWeatherError(data);
        } else {
          setWeatherData(data);
          setWeatherError(null);
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

  const nurseAdvice = useMemo(() => {
    if (!todayDaily?.answers || !weatherData) return null;
    return generateNurseAdvice(weatherData, todayDaily.answers);
  }, [todayDaily, weatherData]);

  // -------------------------
  // レシピ生成
  // -------------------------
  useEffect(() => {
    if (!todayDaily?.answers) return;

    // weatherData が未取得のときは待つ
    if (
      !weatherData ||
      !Number.isFinite(weatherData.temperature_2m) ||
      !Number.isFinite(weatherData.surface_pressure)
    ) {
      return;
    }

    let cancelled = false;
    setRecipeLoading(true);

    getOrGenerateRecipe(weatherData, todayDaily.answers)
      .then((text) => {
        if (cancelled) return;
        setRecipe(text);
      })
      .catch(() => {
        if (cancelled) return;
        setRecipe((prev) => prev ?? null);
      })
      .finally(() => {
        if (cancelled) return;
        setRecipeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [todayDaily?.answers, weatherData]);

  // -------------------------
  // SMI履歴読み込み
  // -------------------------
  useEffect(() => {
    const load = async () => {
      const history = await storage.loadSMIHistory();
      setSmiHistory(history);
    };
    load();
  }, [storage]);

  // -------------------------
  // 日々の記録履歴読み込み（体温グラフ用）
  // -------------------------
  useEffect(() => {
    const load = async () => {
      if (allDailyRecords) {
        setDailyHistory(allDailyRecords);
        return;
      }
      const records = await storage.loadAllDailyRecords();
      setDailyHistory(records);
    };
    load();
  }, [storage, allDailyRecords]);

  // -------------------------
  // 生理周期フェーズ取得
  // -------------------------
  useEffect(() => {
    const load = async () => {
      if (latestPeriod !== undefined) {
        const info = getCyclePhase(latestPeriod?.start || null);
        setPhaseInfo(info);
        return;
      }
      const fetchedPeriod = await storage.getLatestPeriod();
      const info = getCyclePhase(fetchedPeriod?.start || null);
      setPhaseInfo(info);
    };
    load();
  }, [storage, latestPeriod]);

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            ← Dashboard に戻る
          </button>
          <div className="text-xs text-brandMuted">{todayLabel}</div>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b border-brandAccentAlt/30 mb-4">
          {(["daily", "weekly", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "text-brandAccent border-b-2 border-brandAccent"
                  : "text-brandMuted"
              }`}
            >
              {tab === "daily" && "今日"}
              {tab === "weekly" && "週次"}
              {tab === "monthly" && "月次"}
            </button>
          ))}
        </div>

        {activeTab === "daily" && (
          todayDaily?.answers ? (
            <DailyReport
              todayDaily={todayDaily}
              phaseInfo={phaseInfo}
              smiHistory={smiHistory}
              chartData={chartData}
              periodRanges={periodRanges}
              nurseAdvice={nurseAdvice}
              weatherData={weatherData}
              weatherError={weatherError}
              weatherLoading={weatherLoading}
              recipe={recipe}
              recipeLoading={recipeLoading}
            />
          ) : (
            <div className="py-8 text-center text-sm text-brandMuted">
              <p>今日の記録がまだありません。<br />カレンダーから今日を選んで記録してみてくださいね。</p>
            </div>
          )
        )}

        {activeTab === "weekly" && (
          <WeeklyReport
            weeklyData={weeklyData}
            todayLabel={todayLabel}
            weekDates={weekDates}
          />
        )}

        {activeTab === "monthly" && (
          <MonthlyReport monthlyData={monthlyData} />
        )}
      </div>
    </div>
  );
}
