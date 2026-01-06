import React, { useState, useEffect } from "react";
import { DailyAnswerValue, DailyRecord } from "../types/daily";
import { PeriodBleedingLevel, PeriodRecord, PeriodSymptoms } from "../types/period";
import SymptomToggle from "../components/period/SymptomToggle";
import { useStorage } from "../hooks/useStorage";

// ▼ 生理症状の定義（PeriodInputScreenから移植）
const PERIOD_SYMPTOMS: Array<{ key: keyof PeriodSymptoms; label: string }> = [
  { key: "cramp", label: "⚡ 腹痛・生理痛" },
  { key: "backpain", label: "💥 腰痛" },
  { key: "headache", label: "🤕 頭痛" },
  { key: "nausea", label: "🤢 吐き気" },
  { key: "fatigue", label: "💤 だるさ・倦怠感" },
  { key: "mood", label: "☁️ 気分の落ち込み" },
  { key: "irritability", label: "💢 イライラ" },
  { key: "breastPain", label: "👙 胸の張り・痛み" },
];

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
  temperature: "基礎体温",
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
  const storage = useStorage();

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
                    {key === 'temperature' && data.answers[key]
                      ? `${data.answers[key]}℃`
                      : data.answers[key]}
                  </div>
                </div>
              );
            })}
            {/* メモ表示 */}
            {data.memo && (
              <div>
                <div className="text-sm text-brandMutedAlt mb-1">メモ</div>
                <div className="w-full bg-brandInput py-2 px-3 rounded-input text-neutralMuted text-sm whitespace-pre-wrap">
                  {data.memo}
                </div>
              </div>
            )}
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
  
  // State管理
  const [isPeriodLocal, setIsPeriodLocal] = useState<boolean>(false);
  const [bleeding, setBleeding] = useState<PeriodBleedingLevel | "無い">("無い");
  const [symptoms, setSymptoms] = useState<PeriodSymptoms>({
    cramp: false, backpain: false, headache: false, nausea: false,
    fatigue: false, mood: false, irritability: false, breastPain: false,
  });
  const [temperature, setTemperature] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null); // デイリー項目の開閉用

  // 初期データロード（haru_periods と DailyRecord の同期）
  useEffect(() => {
    // 1. 生理記録の確認
    const list = JSON.parse(localStorage.getItem("haru_periods") || "[]") as PeriodRecord[];
    const periodRecord = list.find((r) => r.start === data.date);

    if (periodRecord) {
      setIsPeriodLocal(true);
      setBleeding(periodRecord.bleeding);
      setSymptoms(periodRecord.symptoms);
      // メモは PeriodRecord にあればそれを優先、なければ DailyRecord
      setMemo(periodRecord.memo || data.memo || "");
    } else {
      setIsPeriodLocal(!!data.isPeriod);
      // answers.bleeding を反映
      const ans = data.answers.bleeding;
      if (ans === "少ない" || ans === "普通" || ans === "多い") {
        setBleeding(ans as PeriodBleedingLevel);
      } else {
        setBleeding("無い");
      }
      setMemo(data.memo || "");
    }

    // 2. 体温の確認
    setTemperature(data.answers.temperature || "");
  }, [data]);

  // デイリー項目の変更ハンドラ（ローカルstateではなく、親のonUpdateを呼ぶ形だが、ここでは保存時にまとめて処理するため、一時的にanswersを更新する関数が必要かも。
  // ただし既存実装は onUpdate を呼んでいる。ここではUIの整合性を保つため、DailyItems部分は既存の仕組み（onUpdate）を利用しつつ、
  // 生理・体温・メモはローカルStateで管理し、保存時にマージする戦略をとる。
  
  const handleSelect = (key: string, value: DailyAnswerValue | string) => {
    // answersを更新して親に通知（UI上の表示更新のため）
    const updated: DailyRecord = {
      ...data,
      answers: { ...data.answers, [key]: value },
    };
    onUpdate(updated);
  };

  const toggleSymptom = (key: keyof PeriodSymptoms) => {
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 pb-24 text-brandText">
      <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm">

        {/* 上部タイトルと戻る */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-semibold">今日の記録の確認</h2>
          <button onClick={onBack} className="text-sm text-brandMutedAlt">
            戻る
          </button>
        </div>

        {/* 生理中トグル */}
        <div className="mb-6 flex items-center justify-between bg-brandInput p-3 rounded-card">
          <span className="text-sm font-semibold text-brandText">今日は生理中ですか？</span>
          <button
            onClick={() => {
              const next = !isPeriodLocal;
              setIsPeriodLocal(next);
              if (next && bleeding === "無い") {
                setBleeding("普通");
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPeriodLocal ? "bg-brandAccent" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPeriodLocal ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* 出血量（常時表示） */}
        <div className="mb-6">
          <label className="block text-sm text-brandMutedAlt mb-2">出血量</label>
          <div className="flex gap-2">
            <button
              onClick={() => setBleeding("無い")}
              className={`flex-1 py-3 rounded-button border flex flex-col items-center justify-center gap-1 transition-colors ${
                bleeding === "無い"
                  ? "bg-brandAccent text-white border-brandAccent"
                  : "bg-white text-brandText border-brandAccentAlt/50 hover:bg-brandBg"
              }`}
            >
              <span className="text-lg leading-none">🚫</span>
              <span className="text-xs font-medium">無い</span>
            </button>

                {(["少ない", "普通", "多い"] as PeriodBleedingLevel[]).map((level) => {
                  let icon = "💧";
                  if (level === "普通") icon = "💧💧";
                  if (level === "多い") icon = "💧💧💧";
                  const isSelected = bleeding === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setBleeding(level)}
                      className={`flex-1 py-3 rounded-button border flex flex-col items-center justify-center gap-1 transition-colors ${
                        isSelected
                          ? "bg-brandAccent text-white border-brandAccent"
                          : "bg-white text-brandText border-brandAccentAlt/50 hover:bg-brandBg"
                      }`}
                    >
                      <span className="text-lg leading-none">{icon}</span>
                      <span className="text-xs font-medium">{level}</span>
                    </button>
                  );
                })}
              </div>
              {!isPeriodLocal && bleeding !== "無い" && (
                <p className="text-xs text-brandAccent mt-2">
                  ※生理外の出血（不正出血）として記録されます
                </p>
              )}
        </div>

        {/* ▼ 生理詳細（トグルON時のみ表示） */}
        {isPeriodLocal && (
          <div className="mb-6 space-y-6 border-b border-dashed border-brandAccentAlt/30 pb-6">
            {/* 症状 */}
            <div>
              <label className="block text-sm text-brandMutedAlt mb-3">症状（複数選択可）</label>
              <div className="grid grid-cols-2 gap-2">
                {PERIOD_SYMPTOMS.map((sym) => (
                  <SymptomToggle
                    key={sym.key}
                    label={sym.label}
                    active={symptoms[sym.key]}
                    onToggle={() => toggleSymptom(sym.key)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ▼ デイリー項目一覧（体温・出血以外） */}
        <div className="space-y-4">
          {Object.keys(answers).map((key) => {
            // 体温と出血は別途UIがあるのでここではスキップ
            if (key === "temperature" || key === "bleeding") return null;

            const label = LABELS[key] ?? key;
            return (
              <div key={key}>
                <div className="text-sm text-brandMutedAlt mb-1">
                  {label}
                </div>
                <>
                    {/* 現在の値 */}
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
                </>
              </div>
            );
          })}
        </div>

        {/* ▼ 基礎体温 */}
        <div className="mt-6">
          <label className="block text-sm text-brandMutedAlt mb-2">
            基礎体温 (℃)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="36.50"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="w-full py-2 px-3 border rounded-button bg-brandInput"
          />
        </div>

        {/* ▼ メモ */}
        <div className="mt-6">
          <label className="block text-sm text-brandMutedAlt mb-2">メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full py-2 px-3 border rounded-button bg-brandInput min-h-[80px] text-sm"
            placeholder="気になったことなど"
          />
        </div>

        {/* ▼ 追加：保存ボタン */}
        <button
          onClick={async () => {
            // 1. haru_periods の更新（同期）
            const list = JSON.parse(localStorage.getItem("haru_periods") || "[]") as PeriodRecord[];
            let nextList = [...list];

            if (isPeriodLocal) {
              // ONの場合：既存があれば更新、なければ追加
              if (bleeding === "無い") {
                alert("生理中は出血量を選択してください。");
                return;
              }
              const idx = nextList.findIndex((r) => r.start === data.date);
              
              if (idx >= 0) {
                nextList[idx] = { ...nextList[idx], bleeding: bleeding as PeriodBleedingLevel, symptoms, memo };
              } else {
                nextList.push({
                  start: data.date,
                  bleeding: bleeding as PeriodBleedingLevel,
                  symptoms,
                  memo,
                });
                nextList.sort((a, b) => (a.start > b.start ? -1 : 1));
              }
            } else {
              // OFFの場合：リストから削除
              nextList = nextList.filter((r) => r.start !== data.date);
            }
            localStorage.setItem("haru_periods", JSON.stringify(nextList));

            // 2. DailyRecord の保存
            // answers に体温と出血（ONの場合）を反映
            const finalAnswers = { ...data.answers };
            if (temperature) finalAnswers.temperature = temperature;
            finalAnswers.bleeding = bleeding;
            // OFFの場合は出血情報を削除するか、そのままにするか。
            // ここでは整合性のため、OFFなら出血情報はanswersから消す（または更新しない）のが安全だが、
            // 既存の回答を消してしまうリスクもあるため、上書きのみ行う。
            
            const recordToSave: DailyRecord = {
              ...data,
              isPeriod: isPeriodLocal,
              answers: finalAnswers,
              memo: memo,
            };

            await storage.saveDailyRecord(recordToSave);
            
            // 親コンポーネントの状態も更新
            onUpdate(recordToSave);

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
