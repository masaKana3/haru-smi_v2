import React, { useEffect, useMemo, useState } from "react";
import { DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { generateNurseAdvice } from "../logic/advice/nurseAdvice";
import { getOrGenerateRecipe } from "../logic/advice/recipeSuggestion";
import { fetchWeather, WeatherData, WeatherError } from "../api/weather";
import { useStorage } from "../hooks/useStorage";
import { SMIRecord } from "../types/smi";
import SMIScoreChart from "../components/smi/SMIScoreChart";
import TemperatureChart from "../components/daily/TemperatureChart";
import { getCyclePhase, PhaseInfo } from "../logic/core/periodPrediction";
import CyclePhaseAnalysis from "../components/insight/CyclePhaseAnalysis";

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

  // -------------------------
  // ★ WEATHER + ANSWERS のログ（追加）
  // -------------------------
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
  }, [todayDaily?.answers, weatherData]);   // ← JSON.stringify は絶対に不要！！

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

  // -------------------------
  // ★ RECIPE 状態ログ（追加）
  // -------------------------
  const todayLabel = todayDaily?.date ?? new Date().toISOString().slice(0, 10);

  if (!todayDaily?.answers) {
    return (
      <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
        <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm space-y-4">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            ← Dashboard に戻る
          </button>
          <h1 className="text-lg font-semibold">今日の詳しいアドバイス</h1>
          <p className="text-sm text-brandMuted leading-relaxed">
            今日の記録がまだありません。カレンダーから今日を選んで記録してみてくださいね。
          </p>
        </div>
      </div>
    );
  }

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

        <h1 className="text-lg font-semibold">今日の詳しいアドバイス</h1>

        {phaseInfo && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-brandText">🔄 現在の周期リズム</div>
            <CyclePhaseAnalysis phaseInfo={phaseInfo} />
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-semibold text-brandText">📈 更年期指数の推移</div>
          <SMIScoreChart history={smiHistory} />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-brandText">🌡️ 基礎体温の推移</div>
          <TemperatureChart records={dailyHistory} />
        </div>

        {/* ★removed: condition advice UI */}

        {nurseAdvice && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-brandText">🩺 ナースのやさしいひとこと</div>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {nurseAdvice}
            </p>
          </div>
        )}

        {weatherData && todayDaily?.answers && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-brandText">
              🍳 今日のおすすめレシピ
            </div>

            {recipeLoading && (
              <p className="text-xs text-brandMuted">
                レシピを生成中です…
              </p>
            )}

            {recipe && (
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {recipe}
              </p>
            )}

            {!recipeLoading && !recipe && (
              <p className="text-sm text-brandMuted">
                レシピの取得に失敗しました
              </p>
            )}
          </div>
        )}

        {!weatherLoading && weatherError && (
          <div className="text-xs text-brandMuted">天気の取得に失敗しました: {weatherError.message}</div>
        )}
      </div>
    </div>
  );
}
