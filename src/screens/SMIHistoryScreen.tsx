import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStorage } from "../hooks/useStorage";
import { SMIRecord } from "../types/smi";

type Props = {
  onBack: () => void;
  onStartMeasure: () => void;
};

export default function SMIHistoryScreen({ onBack, onStartMeasure }: Props) {
  const storage = useStorage();
  const [history, setHistory] = useState<SMIRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await storage.loadSMIHistory();
      // 日付昇順にソート（グラフ用）
      const sorted = [...data].sort((a, b) => (a.date > b.date ? 1 : -1));
      setHistory(sorted);
      setLoading(false);
    };
    load();
  }, [storage]);

  const latestRecord = history.length > 0 ? history[history.length - 1] : null;
  const latestScore = latestRecord?.total ?? 0;

  // 小山嵩夫氏の評価法に基づくアドバイス
  const getAdvice = (score: number) => {
    if (score <= 25) return "上手に更年期を過ごしています。これまでの生活態度を続けていいでしょう。";
    if (score <= 50) return "食事、運動などに注意を払い、生活様式などにも無理をしないようにしましょう。";
    if (score <= 65) return "医師の診察を受け、生活指導、カウンセリング、薬物療法を受けた方がいいでしょう。";
    if (score <= 80) return "長期間（半年以上）の計画的な治療が必要でしょう。";
    return "各科の精密検査を受け、更年期障害のみである場合は、専門医での長期的な対応が必要でしょう。";
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-brandMuted">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-brandAccent hover:opacity-80 transition-opacity"
          >
            戻る
          </button>
          <div className="text-md font-semibold">履歴とアドバイス</div>
          <div className="w-8" />
        </div>

        {/* 最新の結果カード */}
        <div className="bg-white/60 border border-white/20 rounded-card p-6 shadow-sm text-center space-y-4">
          <div className="text-sm font-semibold text-brandMuted">現在の更年期指数</div>
          <div className="text-4xl font-bold text-brandAccent">{latestRecord ? latestScore : "—"}</div>
          
          {latestRecord ? (
            <div className="text-xs text-left bg-brandInput p-3 rounded-md leading-relaxed text-brandText">
              {getAdvice(latestScore)}
            </div>
          ) : (
            <div className="text-xs text-brandMuted">まだ記録がありません。</div>
          )}

          <button
            onClick={onStartMeasure}
            className="w-full py-3 bg-brandAccent text-white rounded-button text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            新しく計測する
          </button>
        </div>

        {/* グラフ */}
        {history.length > 0 && (
          <div className="bg-white/60 border border-white/20 rounded-card p-4 shadow-sm space-y-4">
            <div className="text-sm font-semibold">スコア推移</div>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#888', fontSize: 10 }} 
                    tickFormatter={(date) => date.slice(5).replace('-', '/')}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#888', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    labelStyle={{ color: '#888', marginBottom: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#F472B6"
                    strokeWidth={3}
                    dot={{ fill: '#F472B6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}