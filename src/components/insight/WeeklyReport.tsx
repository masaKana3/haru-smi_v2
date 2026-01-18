import React from "react";
import { SYMPTOM_LABELS } from "./constants";
import { WeeklyReportData } from "../../hooks/useInsightData";

type Props = {
  weeklyData: WeeklyReportData;
  todayLabel: string;
  weekDates: string[];
};

export default function WeeklyReport({ weeklyData, todayLabel, weekDates }: Props) {
  return (
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
  );
}