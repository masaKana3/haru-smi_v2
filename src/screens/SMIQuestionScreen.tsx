import React, { useState } from "react";
import { calculateTotalSMIScore } from "../logic/smiLogic";
import {
  SMIAnswers,
  SMIAnswerLabel,
  SMIAnswerValue,
  SMIConvertedAnswer,
  SMIQuestionId,
} from "../types/smi";
import SMIQuestion from "../components/smi/SMIQuestion";

// 質問文
const questions: string[] = [
  "最近、顔がほてることがありますか？",
  "最近、汗をかきやすいと感じますか？",
  "手足が冷えやすいと感じますか？",
  "息切れや動悸を感じることがありますか？",
  "寝つきが悪い、または眠りが浅いと感じますか？",
  "怒りやすい、イライラしやすいと感じますか？",
  "くよくよしたり、憂うつになることがありますか？",
  "頭痛・めまい・吐き気を感じることがありますか？",
  "最近、疲れやすいと感じますか？",
  "肩こり・腰痛・手足の痛みを感じることがありますか？",
];

// 回答ID（DailyCheck や Dashboard で使う）
const questionIds: SMIQuestionId[] = [
  "hotflash",
  "sweat",
  "cold",
  "palpitation",
  "sleep",
  "irritability",
  "mood",
  "condition",
  "fatigue",
  "pain",
];

// 数値 → ラベル変換
const toLabel = (v: SMIAnswerValue | null): SMIAnswerLabel =>
  v === 0 ? "強い" : v === 1 ? "中くらい" : v === 2 ? "弱い" : "無い";


// ---------------------------------------------------------
// レビュー画面
// ---------------------------------------------------------
type ReviewScreenProps = {
  answers: SMIAnswers;
  onConfirm: () => void;
  onEdit: (index: number) => void;
};

function ReviewScreen({ answers, onConfirm, onEdit }: ReviewScreenProps) {
  return (
    <div className="w-full h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="max-w-sm w-full bg-white rounded-card p-6 shadow-sm">
        <h2 className="text-center text-lg font-semibold mb-4">
          回答内容の確認
        </h2>

        <ul className="text-sm leading-relaxed">
          {answers.map((ans, i) => (
            <li
              key={i}
              className="mb-3 cursor-pointer"
              onClick={() => onEdit(i)}
            >
              <div className="font-medium mb-1">Q{i + 1}：{questions[i]}</div>
              <div className="ml-2 underline text-brandText">
                {toLabel(ans)}
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={onConfirm}
          className="mt-6 w-full py-3 bg-brandAccent text-white rounded-button"
        >
          診断する
        </button>
      </div>
    </div>
  );
}


// ---------------------------------------------------------
// メイン（質問進行画面）
// ---------------------------------------------------------
export default function SMIQuestionScreen({
  onFinish,
}: {
  onFinish: (total: number, answers: SMIConvertedAnswer[]) => void;
}) {
  const [index, setIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<SMIAnswers>(Array(10).fill(null));
  const [showReview, setShowReview] = useState<boolean>(false);

  const handleAnswer = (value: SMIAnswerValue) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);

    if (index < 9) {
      setIndex(index + 1);
    } else {
      setShowReview(true);
    }
  };

  const handleEdit = (qIndex: number) => {
    setIndex(qIndex);
    setShowReview(false);
  };

  // スコア確定
  const confirmScore = () => {
    const total = calculateTotalSMIScore(answers);

    // {id, value} 形式に変換
    const converted: SMIConvertedAnswer[] = answers.map((v, i) => ({
      id: questionIds[i],
      value: toLabel(v),
    }));

    // App.tsx へ返す
    onFinish(total, converted);
  };


  // ---------------------------------------------------------
  // 画面表示（質問 or レビュー）
  // ---------------------------------------------------------
  if (showReview) {
    return (
      <ReviewScreen
        answers={answers}
        onConfirm={confirmScore}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <div className="w-full h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">

      <div className="w-full max-w-sm text-center text-xs mb-6 tracking-wide text-brandMuted">
        {index + 1} / 10
      </div>

      <SMIQuestion question={questions[index]} onAnswer={handleAnswer} />
    </div>
  );
}
