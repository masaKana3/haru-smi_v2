import React, { ReactNode } from "react";
import Card from "../layout/Card";
import SectionTitle from "../layout/SectionTitle";

type Props = {
  onOpen: () => void;
  children: ReactNode;
};

export default function CommunityPreviewCard({ onOpen, children }: Props) {
  return (
    <Card className="p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle className="mb-0">今日のテーマ</SectionTitle>
        <button
          onClick={onOpen}
          className="text-xs text-brandAccent hover:opacity-80 transition-opacity font-semibold"
        >
          すべて見る ＞
        </button>
      </div>

      <div className="space-y-2">{children}</div>

    </Card>
  );
}
