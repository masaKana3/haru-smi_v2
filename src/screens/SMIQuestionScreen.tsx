import React, { useState } from "react";
import { SMIConvertedAnswer, SMIQuestionId, SMIAnswerLabel } from "../types/smi";

// SMI質問定義（小山嵩夫先生の簡略更年期指数）
const SMI_ITEMS = [
  { id: 1, text: "顔がほてる", weights: { strong: 10, medium: 6, weak: 3, none: 0 } },
  { id: 2, text: "汗をかきやすい", weights: { strong: 10, medium: 6, weak: 3, none: 0 } },
  { id: 3, text: "腰や手足が冷えやすい", weights: { strong: 14, medium: 9, weak: 5, none: 0 } },
  { id: 4, text: "息切れ、動悸がする", weights: { strong: 12, medium: 8, weak: 4, none: 0 } },
  { id: 5, text: "寝つきが悪い、または眠りが浅い", weights: { strong: 14, medium: 9, weak: 5, none: 0 } },
  { id: 6, text: "怒りやすく、イライラする", weights: { strong: 12, medium: 8, weak: 4, none: 0 } },
  { id: 7, text: "くよくよしたり、憂鬱になる", weights: { strong: 7, medium: 5, weak: 3, none: 0 } },
  { id: 8, text: "頭痛、めまい、吐き気がよくある", weights: { strong: 7, medium: 5, weak: 3, none: 0 } },
  { id: 9, text: "疲れやすい", weights: { strong: 7, medium: 5, weak: 3, none: 0 } },
  { id: 10, text: "肩こり、腰痛、手足の痛みがある", weights: { strong: 7, medium: 5, weak: 3, none: 0 } },
];

type Props = {
  onFinish: (total: number, answers: SMIConvertedAnswer[]) => void;
  onCancel: () => void;
};

export default function SMIQuestionScreen({ onFinish, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { score: number; label: string }>>({});

  const currentItem = SMI_ITEMS[step];
  const totalSteps = SMI_ITEMS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSelect = (score: number, label: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentItem.id]: { score, label },
    }));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // 計算して終了
      let total = 0;
      const converted: SMIConvertedAnswer[] = [];
      
      SMI_ITEMS.forEach((item) => {
        const ans = answers[item.id];
        if (ans) {
          total += ans.score;
          converted.push({
            id: item.id as any as SMIQuestionId,
            value: ans.label as SMIAnswerLabel,
          });
        }
      });
      onFinish(total, converted);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentAnswer = answers[currentItem.id];

  return (
    <div className="w-full min-h-screen flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm">
        {/* 戻るボタン */}
        <div className="mb-4">
          <button onClick={onCancel} className="text-sm text-brandMuted hover:text-brandText">
            ← 戻る
          </button>
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-brandMuted mb-1">
            <span>Question {step + 1}</span>
            <span>{totalSteps}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brandAccent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 質問カード */}
        <div className="bg-white/60 border border-white/20 rounded-card p-6 shadow-sm mb-6 min-h-[300px] flex flex-col justify-center items-center text-center">
          <h2 className="text-lg font-semibold mb-8">{currentItem.text}</h2>
          
          <div className="w-full space-y-3">
            <OptionButton 
              label="強" 
              selected={currentAnswer?.label === "強"} 
              onClick={() => handleSelect(currentItem.weights.strong, "強")} 
            />
            <OptionButton 
              label="中" 
              selected={currentAnswer?.label === "中"} 
              onClick={() => handleSelect(currentItem.weights.medium, "中")} 
            />
            <OptionButton 
              label="弱" 
              selected={currentAnswer?.label === "弱"} 
              onClick={() => handleSelect(currentItem.weights.weak, "弱")} 
            />
            <OptionButton 
              label="無" 
              selected={currentAnswer?.label === "無"} 
              onClick={() => handleSelect(currentItem.weights.none, "無")} 
            />
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`flex-1 py-3 rounded-button font-semibold transition-colors ${
              step === 0 
                ? "bg-transparent text-transparent cursor-default" 
                : "bg-white text-brandMuted border border-brandAccentAlt/50 hover:bg-gray-50"
            }`}
          >
            戻る
          </button>
          
          <button
            onClick={handleNext}
            disabled={!currentAnswer}
            className={`flex-1 py-3 rounded-button font-semibold text-white transition-colors ${
              !currentAnswer
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-brandAccent hover:opacity-90"
            }`}
          >
            {step === totalSteps - 1 ? "結果を計算する" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 rounded-button border transition-all ${
        selected
          ? "bg-brandAccent text-white border-brandAccent shadow-md scale-[1.02]"
          : "bg-white text-brandText border-brandAccentAlt/30 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}