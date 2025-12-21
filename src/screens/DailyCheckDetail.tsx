import React, { useState } from "react";
import { DailyAnswerValue, DailyRecord } from "../types/daily";

// 表示ラベル（共通）
const LABELS: Record<string, string> = {
  hotflash: "ほてり",
  sweat: "汗のかきやすさ",
  sleep: "睡眠の質",
  fatigue: "疲れやすさ",
  pain: "肩こり・痛み",
  cold: "冷え",
  mood: "気分の落ち込み",
  irritability: "イライラ",
  condition: "頭痛・めまい・吐き気",
  headache: "頭痛・めまい・吐き気",
  palpitation: "動悸・息切れ",
  bleeding: "出血",
};

type Props = {
  data: DailyRecord | null;
  selectedDate: string;
  isToday: boolean;
  readOnly?: boolean;
  onBack: () => void;
  onUpdate: (updated: DailyRecord) => void;
};

export default function DailyCheckDetail({
  data,
  selectedDate,
  isToday,
  onBack,
  onUpdate,
}: Props) {
  if (!data) {
    return (
      <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
        <div className="max-w-sm w-full bg-white rounded-card p-6 shadow-sm text-center">
          <p className="text-sm mb-4">記録がありません。</p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-brandAccent text-white rounded-button"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  //------------------------------------------------------------
  // ① 過去日の場合：読み取り専用の一覧ビューを表示
  //------------------------------------------------------------
  if (!isToday) {
    return (
      <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
        <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm">

          <h2 className="text-md font-semibold mb-4 text-center">
            {selectedDate} の記録
          </h2>

          <div className="text-xs text-red-500 text-center mb-4">
            ※ 過去日の記録は編集できません
          </div>

          <div className="space-y-4">
            {Object.keys(data.answers).map((key) => {
              const label = LABELS[key] ?? key;
              return (
                <div key={key}>
                  <div className="text-sm text-brandMutedAlt mb-1">{label}</div>
                  <div className="w-full bg-brandInput py-2 px-3 rounded-input text-neutralMuted text-sm">
                    {data.answers[key]}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onBack}
            className="mt-6 w-full py-3 bg-brandAccent text-white rounded-button"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  //------------------------------------------------------------
  // ② 今日の記録：従来の編集フォーム（編集可能）
  //------------------------------------------------------------
  const answers = data.answers;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSelect = (key: string, value: DailyAnswerValue) => {
    const updated: DailyRecord = {
      ...data,
      answers: { ...data.answers, [key]: value },
    };
    onUpdate(updated); // state 更新
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm">

        {/* 上部タイトルと戻る */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-semibold">今日の記録の確認</h2>
          <button onClick={onBack} className="text-sm text-brandMutedAlt">
            戻る
          </button>
        </div>

        {/* 項目一覧（編集可能） */}
        <div className="space-y-4">
          {Object.keys(answers).map((key) => {
            const label = LABELS[key] ?? key;
            return (
              <div key={key}>
                <div className="text-sm text-brandMutedAlt mb-1">
                  {label}
                </div>

                {/* 現在の値（クリックで選択肢展開） */}
                <button
                  onClick={() => setExpandedId(expandedId === key ? null : key)}
                  className="w-full bg-brandInput py-2 px-3 rounded-input text-left"
                >
                  {answers[key]}
                </button>

                {/* 選択肢（展開時） */}
                {expandedId === key && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {(["強い", "中くらい", "弱い", "無い"] as DailyAnswerValue[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => handleSelect(key, v)}
                        className="px-3 py-1 bg-white border rounded-full text-xs"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ▼ 追加：保存ボタン */}
        <button
          onClick={() => {
            localStorage.setItem(
              `haru_daily_${data.date}`,
              JSON.stringify(data)
            );
            alert("記録を保存しました！");
          }}
          className="mt-6 w-full py-3 bg-brandAccent text-white rounded-button"
        >
          保存する
        </button>

      </div>
    </div>
  );
}
