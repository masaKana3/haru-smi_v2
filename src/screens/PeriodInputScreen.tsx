import React, { useState, useEffect } from "react";
import { useStorage } from "../hooks/useStorage";
import {
  PeriodBleedingLevel,
  PeriodRecord,
  PeriodSymptoms,
} from "../types/period";
import { DailyRecord } from "../types/daily";
import SymptomToggle from "../components/period/SymptomToggle";

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = ("0" + (date.getMonth() + 1)).slice(-2);
  const d = ("0" + date.getDate()).slice(-2);
  return `${y}-${m}-${d}`;
}

// ▼ 生理症状の定義（絵文字追加）
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

type Props = {
  onBack: () => void;
  onSaved: () => void;
};

export default function PeriodInputScreen({ onBack, onSaved }: Props) {
  const storage = useStorage();
  const today = toYMD(new Date());

  const [startDate, setStartDate] = useState<string>(today);
  const [bleeding, setBleeding] = useState<PeriodBleedingLevel>("普通");
  const [temperature, setTemperature] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [isPeriod, setIsPeriod] = useState<boolean>(true);

  const [symptoms, setSymptoms] = useState<PeriodSymptoms>({
    cramp: false,
    backpain: false,
    headache: false,
    nausea: false,
    fatigue: false,
    mood: false,
    irritability: false,
    breastPain: false,
  });

  // ▼ 日付変更時にその日の体温を取得して表示
  useEffect(() => {
    // 生理期間リストに含まれているかチェックしてトグルに反映
    const checkPeriod = () => {
      const list = JSON.parse(localStorage.getItem("haru_periods") || "[]") as PeriodRecord[];
      const exists = list.some((r) => r.start === startDate);
      // 既存データがあればその状態に、なければデフォルトON（入力画面なので）
      if (exists) setIsPeriod(true);
      else setIsPeriod(true);
    };
    checkPeriod();

    const loadDaily = async () => {
      const record = await storage.loadDailyRecord(startDate);
      if (record && record.answers.temperature) {
        setTemperature(record.answers.temperature);
      } else {
        setTemperature("");
      }
    };
    loadDaily();
  }, [startDate, storage]);

  // ▼ 症状をトグル（ON/OFF）
  const toggleSymptom = (key: keyof PeriodSymptoms) => {
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    // 1. 生理記録リストの更新
    const list = JSON.parse(localStorage.getItem("haru_periods") || "[]") as PeriodRecord[];
    
    // まず既存の同日データを削除（トグルOFFなら削除されたままになる）
    const filtered = list.filter((r) => r.start !== startDate);
    
    if (isPeriod) {
      filtered.push({
        start: startDate,
        bleeding,
        symptoms,
        memo,
      });
    }

    // 日付順にソート
    filtered.sort((a, b) => (a.start > b.start ? -1 : 1));

    localStorage.setItem("haru_periods", JSON.stringify(filtered));

    // 2. DailyRecordの保存（体温・出血・生理フラグ）
    const currentRecord = await storage.loadDailyRecord(startDate);
    
    const recordToSave: DailyRecord = currentRecord
      ? {
          ...currentRecord,
          isPeriod: isPeriod,
          answers: {
            ...currentRecord.answers,
            temperature: temperature,
            bleeding: bleeding, // 出血量も同期
          },
        }
      : {
          date: startDate,
          isPeriod: isPeriod,
          answers: { 
            temperature: temperature,
            bleeding: bleeding,
          },
          items: [], 
        };

    await storage.saveDailyRecord(recordToSave);

    if (onSaved) onSaved();
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm bg-white rounded-card p-6 shadow-sm">

        <h2 className="text-md font-semibold text-center mb-4">月経の記録</h2>

        {/* ▼ 生理開始日 */}
        <div className="mb-6">
          <label className="block text-sm text-brandMutedAlt mb-2">
            生理が始まった日
          </label>
          <input
            type="date"
            value={startDate}
            max={today}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full py-2 px-3 border rounded-button bg-brandInput"
          />
        </div>

        {/* ▼ 生理中トグル */}
        <div className="mb-6 flex items-center justify-between bg-brandInput p-3 rounded-card">
          <span className="text-sm font-semibold text-brandText">今日は生理中ですか？</span>
          <button
            onClick={() => setIsPeriod(!isPeriod)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPeriod ? "bg-brandAccent" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPeriod ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* ▼ 出血量（リッチUI） */}
        <div className="mb-6">
          <label className="block text-sm text-brandMutedAlt mb-2">出血量</label>
          <div className="flex gap-2">
            {(["少ない", "普通", "多い"] as PeriodBleedingLevel[]).map((level) => {
              // アイコン決定
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
          {!isPeriod && (
            <p className="text-xs text-brandAccent mt-2">
              ※生理外の出血（不正出血）として記録されます
            </p>
          )}
        </div>

        {/* ▼ 基礎体温（連携） */}
        <div className="mb-6">
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
          <p className="text-[10px] text-brandMuted mt-1">
            ※入力すると今日のデイリーチェックにも反映されます
          </p>
        </div>

        {/* ▼ 症状（複数選択） */}
        <div className="mb-6">
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

        {/* ▼ メモ */}
        <div className="mb-6">
          <label className="block text-sm text-brandMutedAlt mb-2">メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full py-2 px-3 border rounded-button bg-brandInput min-h-[80px] text-sm"
            placeholder="気になったことなど"
          />
        </div>

        {/* ▼ 記録する */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-brandAccent text-white rounded-button mt-2 shadow-sm hover:opacity-90 transition-opacity"
        >
          記録する
        </button>

        {/* ▼ 戻る */}
        <button
          onClick={onBack}
          className="w-full py-3 bg-transparent text-brandMuted rounded-button mt-2 hover:text-brandText transition-colors"
        >
          キャンセル
        </button>

      </div>
    </div>
  );
}
