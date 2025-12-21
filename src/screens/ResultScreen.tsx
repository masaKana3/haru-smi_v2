import React from "react";

type ResultScreenProps = {
  total: number | null;
  onGoDashboard: () => void;
};

export default function ResultScreen({ total, onGoDashboard }: ResultScreenProps) {
  const safeTotal = total ?? 0;

  return (
    <div className="w-full h-screen bg-brandBg flex flex-col items-center p-8 text-brandText">
      <div className="max-w-sm w-full bg-white rounded-card p-8 shadow-sm text-center">
        <h2 className="text-[20px] font-semibold mb-6">あなたの更年期指数（SMI）</h2>

        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
            <path
              className="text-brandTrack"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
            />
            <path
              className="text-brandAccent"
              strokeWidth="3.5"
              strokeDasharray={`${(safeTotal / 100) * 100}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-brandTextStrong">
            {safeTotal}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-brandText mb-6">
          {safeTotal <= 25 && "上手に更年期を過ごしています。"}
          {safeTotal > 25 && safeTotal <= 50 && "生活の見直しに気を配りましょう。"}
          {safeTotal > 50 && safeTotal <= 65 && "医師・カウンセリングの相談が有用です。"}
          {safeTotal > 65 && safeTotal <= 80 && "長期的なケアが必要です。"}
          {safeTotal > 80 && "専門医での長期的な対応が必要です。"}
        </p>

        <button
          onClick={onGoDashboard}
          className="w-full py-3 bg-brandAccent text-white rounded-button"
        >
          ダッシュボードへ
        </button>
      </div>
    </div>
  );
}