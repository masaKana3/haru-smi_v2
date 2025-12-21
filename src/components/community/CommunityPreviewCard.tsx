import React from "react";
import Card from "../layout/Card";
import SectionTitle from "../layout/SectionTitle";

type Props = {
  onOpen: () => void;
};

const sampleTopics = [
  "📝 最近冷え対策で良かったことは？",
  "💬 今日気づいた“ひとつのインサイト”を共有しよう",
  "🔥 眠りを深くするために試したこと",
];

export default function CommunityPreviewCard({ onOpen }: Props) {
  return (
    <Card className="bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle className="mb-0">メンバー限定掲示板</SectionTitle>
        <span className="text-xs text-brandAccent bg-brandBubble px-2 py-1 rounded-button">
          プレビュー
        </span>
      </div>

      <div>
        <div className="text-xs text-brandMuted mb-2">今日のテーマ</div>
        <ul className="space-y-1 text-sm text-brandText">
          {sampleTopics.map((topic) => (
            <li
              key={topic}
              className="rounded-card bg-brandPanel px-3 py-2 border border-transparent"
            >
              {topic}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onOpen}
        className="w-full py-3 bg-brandAccent text-white rounded-button text-sm hover:opacity-90 transition-opacity"
      >
        掲示板を開く
      </button>
    </Card>
  );
}
