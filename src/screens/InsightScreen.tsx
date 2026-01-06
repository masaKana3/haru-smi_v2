import React, { useEffect, useMemo, useState } from "react";
import { DailyRecord } from "../types/daily";
import { PeriodRecord } from "../types/period";
import { generateNurseAdvice } from "../logic/advice/nurseAdvice";
import { getOrGenerateRecipe } from "../logic/advice/recipeSuggestion";
import { fetchWeather, WeatherData, WeatherError } from "../api/weather";
import { useStorage } from "../hooks/useStorage";
import { SMIRecord } from "../types/smi";
import SMIScoreChart from "../components/smi/SMIScoreChart";
import { getCyclePhase, PhaseInfo } from "../logic/core/periodPrediction";
import CyclePhaseAnalysis from "../components/insight/CyclePhaseAnalysis";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

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

  // -------------------------
  // グラフ用データの準備
  // -------------------------
  const sortedHistory = useMemo(() => {
    // 日付昇順にソート
    return [...dailyHistory].sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [dailyHistory]);

  const chartData = useMemo(() => {
    return sortedHistory.map((r) => ({
      date: r.date.slice(5).replace("-", "/"), // MM/DD
      fullDate: r.date,
      temp: r.answers.temperature ? parseFloat(r.answers.temperature) : null,
      memo: r.memo,
      isPeriod: r.isPeriod,
    }));
  }, [sortedHistory]);

  // 生理期間の範囲を計算（ReferenceArea用）
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
    // 最後の期間を閉じる
    if (currentStart && lastDate) {
      ranges.push({ start: currentStart, end: lastDate });
    }
    return ranges;
  }, [chartData]);

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-brandAccentAlt rounded shadow-lg text-xs z-50">
          <p className="font-bold mb-1">{data.fullDate}</p>
          <p className="text-brandAccent font-semibold text-sm">
            {data.temp ? `${data.temp}℃` : "記録なし"}
          </p>
          {data.isPeriod && <p className="text-rose-500 mt-1">🩸 生理中</p>}
          {data.memo && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-gray-500 whitespace-pre-wrap">📝 {data.memo}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

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
          <div className="w-full h-64 bg-white rounded-card p-2 border border-brandAccentAlt/20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: "#888" }} 
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  domain={[35.5, 37.5]} 
                  tick={{ fontSize: 10, fill: "#888" }} 
                  tickCount={5}
                />
                <Tooltip content={<CustomTooltip />} />
                {periodRanges.map((range, i) => (
                  <ReferenceArea 
                    key={i} 
                    x1={range.start} 
                    x2={range.end} 
                    fill="#ffe4e6" 
                    fillOpacity={0.5} 
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#F472B6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#F472B6", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#EC4899" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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
