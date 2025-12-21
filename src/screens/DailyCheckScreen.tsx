import React, { useEffect, useRef, useState } from "react";
import { getOptionsForItemId } from "../utils/DailyCheckUtils";
import {
  DailyAnswerValue,
  DailyQuestion,
  DailyRecord,
} from "../types/daily";
import ChatBubble from "../components/daily/ChatBubble";
import ChoiceButtons from "../components/daily/ChoiceButtons";

type ChatMessage = {
  id: number;
  from: "bot" | "user";
  text: string;
};

type Props = {
  dailyItems: DailyQuestion[];
  onSave?: (data: DailyRecord) => void;
  onCancel?: () => void;
};

export default function DailyCheckScreen({ dailyItems, onSave, onCancel }: Props) {
  const [index, setIndex] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, DailyAnswerValue>>({});
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 初期メッセージ
  useEffect(() => {
    if (!dailyItems || dailyItems.length === 0) return;
    if (messages.length > 0) return;

    const first = dailyItems[0];

    setMessages([
      {
        id: 1,
        from: "bot",
        text: "今日の体調について、少しだけ教えてもらっても良いですか？",
      },
      {
        id: 2,
        from: "bot",
        text: first.question,
      },
    ]);
  }, [dailyItems, messages.length]);

  // 自動スクロール
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!dailyItems || dailyItems.length === 0) {
    return (
      <div className="w-full h-screen bg-brandBg flex flex-col items-center justify-center text-brandText">
        <div className="bg-white rounded-card p-6 shadow-sm text-sm">
          デイリーチェック項目がまだ設定されていません。
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 text-xs text-brandTextStrong underline"
          >
            ダッシュボードに戻る
          </button>
        )}
      </div>
    );
  }

  const currentItem = dailyItems[index];
  const options: DailyAnswerValue[] = currentItem ? getOptionsForItemId(currentItem.id) : [];

  const handleSelect = (option: DailyAnswerValue) => {
    if (!currentItem) return;

    const newAnswers = {
      ...answers,
      [currentItem.id]: option,
    };
    setAnswers(newAnswers);

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "user", text: option },
    ]);

    const nextIndex = index + 1;

    if (nextIndex < dailyItems.length) {
      const nextItem = dailyItems[nextIndex];
      setIndex(nextIndex);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          from: "bot",
          text: nextItem.question,
        },
      ]);
      return;
    }

    // 最後の質問が終わったら保存
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    const dataToSave: DailyRecord = {
      date: dateStr,
      answers: newAnswers,
      items: dailyItems,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        from: "bot",
        text: "教えてくれてありがとうございます。今日の記録を保存しますね。",
      },
    ]);

    if (onSave) {
      onSave(dataToSave);
    }
  };

  return (
    <div className="w-full h-screen bg-brandBg flex flex-col items-center text-brandText">
      <div className="w-full max-w-sm flex-1 flex flex-col p-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">今日のデイリーチェック</div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-brandTextStrong underline"
            >
              戻る
            </button>
          )}
        </div>

        {/* チャットエリア */}
        <div className="flex-1 overflow-y-auto pr-1">
          {messages.map((m) => (
            <ChatBubble key={m.id} from={m.from} text={m.text} />
          ))}

          {/* 会話内の選択肢（縦並び） */}
          {currentItem && options.length > 0 && (
            <div className="mb-4 flex justify-start">
              <ChoiceButtons options={options} onSelect={handleSelect} />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}
