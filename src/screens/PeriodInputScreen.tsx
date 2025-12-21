/// src/PeriodInputScreen.tsx
import React, { useState } from "react";
import {
  PeriodBleedingLevel,
  PeriodRecord,
  PeriodSymptoms,
} from "../types/period";
import SymptomToggle from "../components/period/SymptomToggle";

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = ("0" + (date.getMonth() + 1)).slice(-2);
  const d = ("0" + date.getDate()).slice(-2);
  return `${y}-${m}-${d}`;
}

// ▼ 生理症状の定義（8項目）
const PERIOD_SYMPTOMS: Array<{ key: keyof PeriodSymptoms; label: string }> = [
  { key: "cramp", label: "腹痛・生理痛" },
  { key: "backpain", label: "腰痛" },
  { key: "headache", label: "頭痛" },
  { key: "nausea", label: "吐き気" },
  { key: "fatigue", label: "だるさ・倦怠感" },
  { key: "mood", label: "気分の落ち込み" },
  { key: "irritability", label: "イライラ" },
  { key: "breastPain", label: "胸の張り・痛み" },
];

type Props = {
  onBack: () => void;
  onSaved: () => void;
};

export default function PeriodInputScreen({ onBack, onSaved }: Props) {
  const today = toYMD(new Date());

  const [startDate, setStartDate] = useState<string>(today);
  const [bleeding, setBleeding] = useState<PeriodBleedingLevel>("普通");

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

  // ▼ 症状をトグル（ON/OFF）
  const toggleSymptom = (key: keyof PeriodSymptoms) => {
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const list = JSON.parse(localStorage.getItem("haru_periods") || "[]") as PeriodRecord[];

    list.push({
      start: startDate,
      bleeding,
      symptoms,
    });

    localStorage.setItem("haru_periods", JSON.stringify(list));

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

        {/* ▼ 出血量 */}
        <div className="mb-6">
          <label className="block text-sm text-brandMutedAlt mb-2">出血量</label>
          <div className="flex gap-2">
            {(["少ない", "普通", "多い"] as PeriodBleedingLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setBleeding(level)}
                className={`flex-1 py-2 rounded-button border text-sm ${
                  bleeding === level
                    ? "bg-brandAccent text-white"
                    : "bg-brandInput text-brandText"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* ▼ 症状（複数選択） */}
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

        {/* ▼ 記録する */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-brandAccent text-white rounded-button mt-6"
        >
          記録する
        </button>

        {/* ▼ 戻る */}
        <button
          onClick={onBack}
          className="w-full py-3 bg-neutralBg text-brandText rounded-button mt-3"
        >
          戻る
        </button>

      </div>
    </div>
  );
}
