import React from "react";
import { SMIAnswerValue } from "../../types/smi";

type Props = {
  question: string;
  onAnswer: (value: SMIAnswerValue) => void;
};

export default function SMIQuestion({ question, onAnswer }: Props) {
  return (
    <div className="w-full max-w-sm bg-brandPanel rounded-card p-8 shadow-sm mb-8">
      <p className="text-[20px] leading-relaxed text-center text-brandTextStrong font-medium">
        {question}
      </p>

      <div className="w-full flex justify-center gap-3 mt-8">
        <button
          onClick={() => onAnswer(0)}
          className="px-6 py-3 rounded-button text-sm bg-brandAccent text-white shadow-sm"
        >
          強い
        </button>

        <button
          onClick={() => onAnswer(1)}
          className="px-6 py-3 rounded-button text-sm bg-brandAccentAlt text-brandText shadow-sm"
        >
          中くらい
        </button>

        <button
          onClick={() => onAnswer(2)}
          className="px-6 py-3 rounded-button text-sm bg-brandAccentAlt2 text-brandText shadow-sm"
        >
          弱い
        </button>
      </div>

      <div
        onClick={() => onAnswer(3)}
        className="w-full text-center text-sm text-brandText mt-8 cursor-pointer"
      >
        無い
      </div>
    </div>
  );
}
