import React from "react";
import { SYMPTOM_LABELS } from "./constants";
import { MonthlyReportData } from "../../hooks/useInsightData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Props = {
  monthlyData: MonthlyReportData;
};

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-brandAccentAlt rounded shadow-lg text-xs z-50">
        <p className="font-bold mb-1">{data.date}</p>
        <p className="text-brandAccent font-semibold text-sm">
          {data.temp ? `${data.temp}℃` : "記録なし"}
        </p>
        {data.isPeriod && <p className="text-rose-500 mt-1">🩸 生理中</p>}
      </div>
    );
  }
  return null;
};

export default function MonthlyReport({ monthlyData }: Props) {
  return (
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
        <div className="w-full h-64 min-w-0 block">
          <ResponsiveContainer width="99%" aspect={1.6} minWidth={0} debounce={1}>
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

      {/* 3. 基礎体温分析 (コメントアウト) */}
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
  );
}