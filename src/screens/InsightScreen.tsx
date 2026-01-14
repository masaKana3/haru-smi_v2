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
  ReferenceLine,
} from "recharts";

// 症状ラベル定義（DailyCheckDetailと合わせる）
const SYMPTOM_LABELS: Record<string, string> = {
  hotflash: "ほてり",
  sweat: "汗のかきやすさ",
  sleep: "睡眠の質",
  fatigue: "疲れやすさ",
  pain: "肩こり・痛み",
  cold: "冷え",
  mood: "気分の落ち込み",
  irritability: "イライラ",
  condition: "頭痛・めまい・吐き気",
  headache: "頭痛",
  palpitation: "動悸・息切れ",
  breastPain: "胸の張り",
};

// ▼ スコア計算ロジック（共通化）
const calculateDailyScore = (record: DailyRecord): number => {
  let dailyScore = 100;
  Object.entries(record.answers).forEach(([key, value]) => {
    if (["temperature", "bleeding", "hospital_visit", "medication_change", "blood_test_note"].includes(key)) return;
    if (value === "強い") dailyScore -= 15;
    else if (value === "中くらい") dailyScore -= 10;
    else if (value === "弱い") dailyScore -= 5;
  });
  return Math.max(0, dailyScore);
};

// ▼ 月次グラフ用のカスタムドット（通院・薬アイコン表示）
const CustomMonthlyDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;

  const icons = [];
  if (payload.hospital) icons.push("🏥");
  if (payload.medication) icons.push("💊");

  if (icons.length > 0) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="#F472B6" stroke="white" strokeWidth={2} />
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="12">{icons.join("")}</text>
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill="#F472B6" stroke="none" />;
};

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

  // -------------------------
  // ★ 週次レポート用データ計算
  // -------------------------
  // 今週の月〜日を計算
  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0:Sun, 1:Mon...
    const diffToMon = day === 0 ? -6 : 1 - day; // 月曜までの差分
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

  const weeklyData = useMemo(() => {
    // 日付ごとのレコードをマップ
    const recordsMap = new Map<string, DailyRecord>();
    dailyHistory.forEach(r => recordsMap.set(r.date, r));

    // 1. タイムライン用データ
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

    // 2. 症状ランキング & スコア
    const symptomCounts: Record<string, number> = {};
    let totalScore = 0;
    let recordCount = 0;

    weekDates.forEach(date => {
      const record = recordsMap.get(date);
      if (!record) return;

      recordCount++;
      
      // スコア計算と症状集計
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

    // ランキング作成
    const ranking = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key);

    const averageScore = recordCount > 0 ? Math.round(totalScore / recordCount) : null;

    return { timeline, ranking, averageScore, recordCount };
  }, [weekDates, dailyHistory]);

  // -------------------------
  // ★ 月次レポート用データ計算
  // -------------------------
  const monthlyData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11

    // 今月の日付リスト生成
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    
    const dates: string[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      // ローカルタイムでのYYYY-MM-DD生成
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${da}`);
    }

    // レコードのマッピング
    const recordsMap = new Map<string, DailyRecord>();
    dailyHistory.forEach(r => recordsMap.set(r.date, r));

    // 1. カレンダー用データ
    const calendarDays = dates.map(date => {
      const record = recordsMap.get(date);
      const d = new Date(date);
      return {
        date,
        day: d.getDate(),
        dayOfWeek: d.getDay(), // 0:Sun - 6:Sat
        record,
        score: record ? calculateDailyScore(record) : null,
        temp: record?.answers.temperature ? parseFloat(record.answers.temperature) : null,
        isPeriod: record?.isPeriod,
        hospital: record?.answers?.hospital_visit === "true",
        medication: record?.answers?.medication_change === "true",
      };
    });

    // 2. 月間スコア平均
    const scores = calendarDays.map(d => d.score).filter((s): s is number => s !== null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    // 先月の平均（簡易計算）
    const lastMonthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const lastMonthEnd = new Date(year, month, 0).toISOString().slice(0, 10);
    const lastMonthScores = dailyHistory
      .filter(r => r.date >= lastMonthStart && r.date <= lastMonthEnd)
      .map(r => calculateDailyScore(r));
    const lastMonthAvg = lastMonthScores.length > 0 
      ? Math.round(lastMonthScores.reduce((a, b) => a + b, 0) / lastMonthScores.length) 
      : null;

    // 3. 基礎体温分析
    const temps = calendarDays.map(d => d.temp).filter((t): t is number => t !== null && !isNaN(t));
    const tempStats = {
      count: temps.length,
      max: temps.length > 0 ? Math.max(...temps) : null,
      min: temps.length > 0 ? Math.min(...temps) : null,
      avg: temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2) : null,
    };

    // 4. 症状ランキング集計
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
          <>
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
          </>
        )}

        {activeTab === "weekly" && (
          <div className="space-y-6">
            {/* ヘッダー: 期間表示 */}
            <div className="text-center mb-2">
              <div className="text-sm font-semibold text-brandText">
                {weekDates[0].slice(5).replace("-", "/")} 〜 {weekDates[6].slice(5).replace("-", "/")}
              </div>
              <div className="text-xs text-brandMuted">今週の記録</div>
            </div>

            {/* 1. タイムライン */}
            <div className="bg-white rounded-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-brandText">📅 1週間の流れ</h3>
              <div className="flex justify-between text-center">
                {weeklyData.timeline.map((day) => (
                  <div key={day.date} className="flex flex-col items-center gap-1 min-w-[32px]">
                    <span className="text-[10px] text-brandMuted">{day.dayLabel}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${
                      day.date === todayLabel ? "border-brandAccent bg-brandAccent/10" : "border-transparent bg-gray-50"
                    }`}>
                      {day.date.slice(8)}
                    </div>
                    <div className="flex flex-col gap-0.5 min-h-[40px] justify-start pt-1">
                      {day.isPeriod && <span className="text-xs" title="生理">🩸</span>}
                      {day.hospital && <span className="text-xs" title="通院">🏥</span>}
                      {day.medication && <span className="text-xs" title="薬変更">💊</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. コンディションスコア */}
            <div className="bg-white rounded-card p-4 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brandText">❤️ 今週の元気度</h3>
                <p className="text-xs text-brandMuted mt-1">
                  {weeklyData.recordCount > 0 
                    ? `${weeklyData.recordCount}日分の記録から算出` 
                    : "記録がありません"}
                </p>
              </div>
              <div className="text-right">
                {weeklyData.averageScore !== null ? (
                  <span className="text-3xl font-bold text-brandAccent">{weeklyData.averageScore}</span>
                ) : (
                  <span className="text-xl text-brandMuted">-</span>
                )}
                <span className="text-sm text-brandMuted ml-1">点</span>
              </div>
            </div>

            {/* 3. 症状ランキング */}
            <div className="bg-white rounded-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-brandText">📉 気になる症状 TOP3</h3>
              {weeklyData.ranking.length > 0 ? (
                <div className="space-y-3">
                  {weeklyData.ranking.map((key, index) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-100 text-gray-600" :
                        "bg-orange-50 text-orange-600"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="text-sm text-brandText flex-1">
                        {SYMPTOM_LABELS[key] || key}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brandMuted text-center py-2">
                  目立った症状の記録はありません。<br/>
                  素晴らしい1週間です！
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "monthly" && (
          <div className="space-y-6">
            {/* ヘッダー */}
            <div className="text-center mb-2">
              <div className="text-sm font-semibold text-brandText">
                {monthlyData.year}年 {monthlyData.month}月
              </div>
              <div className="text-xs text-brandMuted">今月の振り返り</div>
            </div>

            {/* 1. コンディション推移 */}
            <div className="bg-white rounded-card p-4 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brandText">今月の平均元気度</h3>
                <div className="text-xs text-brandMuted mt-1">
                  {monthlyData.lastMonthAvg !== null ? (
                    <>
                      先月 ({monthlyData.lastMonthAvg}点) より
                      <span className={monthlyData.avgScore! >= monthlyData.lastMonthAvg ? "text-brandAccent font-bold ml-1" : "text-blue-500 font-bold ml-1"}>
                        {Math.abs(monthlyData.avgScore! - monthlyData.lastMonthAvg)}pt {monthlyData.avgScore! >= monthlyData.lastMonthAvg ? "アップ ⤴" : "ダウン ⤵"}
                      </span>
                    </>
                  ) : "先月のデータがありません"}
                </div>
              </div>
              <div className="text-right">
                {monthlyData.avgScore !== null ? (
                  <span className="text-3xl font-bold text-brandAccent">{monthlyData.avgScore}</span>
                ) : (
                  <span className="text-xl text-brandMuted">-</span>
                )}
                <span className="text-sm text-brandMuted ml-1">点</span>
              </div>
            </div>

            {/* 2. 月間基礎体温グラフ (カレンダー廃止) */}
            <div className="bg-white rounded-card p-2 shadow-sm">
              <h3 className="text-sm font-semibold mb-2 px-2 text-brandText">📈 基礎体温の変化</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData.calendarDays} margin={{ top: 20, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 10, fill: "#888" }} 
                      interval={2} // 間引き表示
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 10, fill: "#888" }} 
                      tickCount={5}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* 最高・最低ライン */}
                    {monthlyData.tempStats.max && (
                      <ReferenceLine y={monthlyData.tempStats.max} stroke="#F87171" strokeDasharray="3 3" label={{ value: "Max", position: "right", fontSize: 10, fill: "#F87171" }} />
                    )}
                    {monthlyData.tempStats.min && (
                      <ReferenceLine y={monthlyData.tempStats.min} stroke="#60A5FA" strokeDasharray="3 3" label={{ value: "Min", position: "right", fontSize: 10, fill: "#60A5FA" }} />
                    )}

                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#F472B6"
                      strokeWidth={2}
                      dot={<CustomMonthlyDot />}
                      activeDot={{ r: 6, fill: "#EC4899" }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-brandMuted text-right px-2 mt-1">🏥:通院 💊:薬変更</p>
            </div>

            {/* 3. 基礎体温分析 */}
            {/*
            <div className="bg-white rounded-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-brandText">🌡️ 基礎体温の傾向</h3>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-brandInput rounded p-2">
                  <div className="text-[10px] text-brandMuted">平均</div>
                  <div className="text-lg font-bold text-brandText">{monthlyData.tempStats.avg ?? "-"}</div>
                </div>
                <div className="bg-brandInput rounded p-2">
                  <div className="text-[10px] text-brandMuted">最高</div>
                  <div className="text-lg font-bold text-rose-500">{monthlyData.tempStats.max ?? "-"}</div>
                </div>
                <div className="bg-brandInput rounded p-2">
                  <div className="text-[10px] text-brandMuted">最低</div>
                  <div className="text-lg font-bold text-blue-500">{monthlyData.tempStats.min ?? "-"}</div>
                </div>
              </div>
              <div className="text-xs text-brandText bg-brandInput p-3 rounded leading-relaxed">
                {monthlyData.tempStats.count >= 10 ? (
                  (monthlyData.tempStats.max! - monthlyData.tempStats.min!) >= 0.3 
                    ? "💡 体温の変化が見られます。高温期と低温期のリズムがある可能性があります。"
                    : "💡 体温の変動が少ないようです。無排卵の可能性も考えられますが、測定時間なども確認してみましょう。"
                ) : (
                  monthlyData.tempStats.count > 0 
                    ? "💡 分析にはもう少し記録が必要です（目安：月10日以上）"
                    : "今月の体温記録はありません"
                )}
              </div>
            </div>
            */}

            {/* 4. 月間症状ランキング */}
            <div className="bg-white rounded-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-brandText">📉 今月の気になる症状 TOP3</h3>
              {monthlyData.ranking.length > 0 ? (
                <div className="space-y-3">
                  {monthlyData.ranking.map((item, index) => (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-100 text-gray-600" :
                        "bg-orange-50 text-orange-600"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="text-sm text-brandText flex-1">
                        {SYMPTOM_LABELS[item.key] || item.key}
                      </div>
                      <div className="text-xs text-brandMuted">
                        {item.trend === "up" && <span className="text-rose-500">先月より増 ↗</span>}
                        {item.trend === "down" && <span className="text-blue-500">先月より減 ↘</span>}
                        {item.trend === "same" && <span>変化なし</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brandMuted text-center py-2">
                  今月は目立った症状の記録はありません。<br/>
                  穏やかに過ごせています。
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
