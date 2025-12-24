import React from "react";
import { CyclePhase, PhaseInfo } from "../../logic/core/periodPrediction";

type Props = {
  phaseInfo: PhaseInfo;
};

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: "月経期",
  follicular: "卵胞期",
  ovulatory: "排卵期",
  luteal: "黄体期",
  unknown: "データ不足",
};

const PHASE_DESCRIPTIONS: Record<CyclePhase, string> = {
  menstrual: "体温が下がり、血行が悪くなりやすい時期です。無理せず体を温めてリラックスしましょう。",
  follicular: "エストロゲンの分泌が増え、心身ともに好調になりやすい時期です。新しいことを始めるのに適しています。",
  ovulatory: "おりものが増えたり、下腹部痛を感じることがあります。体調の変化に気をつけましょう。",
  luteal: "プロゲステロンの影響で、むくみやイライラが出やすい時期です。自分をいたわり、ゆったり過ごしましょう。",
  unknown: "生理記録を入力すると、現在の周期フェーズが表示されます。",
};

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: "bg-pink-100 text-pink-800 border-pink-200",
  follicular: "bg-blue-100 text-blue-800 border-blue-200",
  ovulatory: "bg-green-100 text-green-800 border-green-200",
  luteal: "bg-orange-100 text-orange-800 border-orange-200",
  unknown: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function CyclePhaseAnalysis({ phaseInfo }: Props) {
  const { phase, dayInCycle } = phaseInfo;
  const label = PHASE_LABELS[phase];
  const description = PHASE_DESCRIPTIONS[phase];
  const colorClass = PHASE_COLORS[phase];

  return (
    <div className={`rounded-card p-4 border ${colorClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-lg">{label}</div>
        {phase !== "unknown" && (
          <div className="text-sm font-medium">周期 {dayInCycle} 日目</div>
        )}
      </div>
      <p className="text-sm leading-relaxed opacity-90">
        {description}
      </p>
    </div>
  );
}