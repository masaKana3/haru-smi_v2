import React from "react";
import { DailyRecord } from "../../types/daily";
import { PhaseInfo } from "../../logic/core/periodPrediction";
import { SMIRecord } from "../../types/smi";
import { WeatherData, WeatherError } from "../../api/weather";
import CyclePhaseAnalysis from "./CyclePhaseAnalysis";
import SMIScoreChart from "../smi/SMIScoreChart";
import { InsightChartData } from "../../hooks/useInsightData";
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
  phaseInfo: PhaseInfo | null;
  smiHistory: SMIRecord[];
  chartData: InsightChartData[];
  periodRanges: { start: string; end: string }[];
  haruAdvice: string | null;
  weatherData: WeatherData | null;
  weatherError: WeatherError | null;
  weatherLoading: boolean;
  recipe: string | null;
  recipeLoading: boolean;
};

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

export default function DailyReport({
  todayDaily,
  phaseInfo,
  smiHistory,
  chartData,
  periodRanges,
  haruAdvice,
  weatherData,
  weatherError,
  weatherLoading,
  recipe,
  recipeLoading,
}: Props) {
  return (
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
        <div className="w-full h-64 bg-white rounded-card p-2 border border-brandAccentAlt/20 min-w-0 block">
          <ResponsiveContainer width="99%" aspect={1.6} minWidth={0} debounce={1}>
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

      {haruAdvice && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-brandText">🌸 はるちゃんのアドバイス</div>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {haruAdvice}
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
  );
}