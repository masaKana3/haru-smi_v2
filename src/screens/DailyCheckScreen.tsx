import React, { useEffect, useRef, useState } from "react";
import { getOptionsForItemId } from "../utils/DailyCheckUtils";
import {
  DailyAnswers,
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
  const [answers, setAnswers] = useState<DailyAnswers>({});
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
    if (!currentItem || typeof option !== 'string') return;

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

  const handleTemperatureSubmit = (temp: string) => {
    if (!currentItem) return;

    const newAnswers = {
      ...answers,
      [currentItem.id]: temp,
    };
    setAnswers(newAnswers);

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "user", text: `${temp} ℃` },
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
    } else {
      // 最後の質問
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);
      const dataToSave: DailyRecord = { date: dateStr, answers: newAnswers, items: dailyItems };
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, from: "bot", text: "教えてくれてありがとうございます。今日の記録を保存しますね。" },
      ]);
      if (onSave) {
        onSave(dataToSave);
      }
    }
  };

  const handleTemperatureSkip = () => {
    if (!currentItem) return;

    // スキップ時は値を保存しない（undefinedのまま）か、空文字を入れる
    // ここでは undefined のまま進める
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "user", text: "（スキップ）" },
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
    } else {
      // 最後の質問
      finishCheck(answers);
    }
  };

  const finishCheck = (finalAnswers: DailyAnswers) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const dataToSave: DailyRecord = { date: dateStr, answers: finalAnswers, items: dailyItems };
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "bot", text: "教えてくれてありがとうございます。今日の記録を保存しますね。" },
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

          {/* 選択肢 or 数値入力 */}
          {currentItem && currentItem.id !== "temperature" && options.length > 0 && (
            <div className="mb-4 flex justify-start">
              <ChoiceButtons options={options} onSelect={handleSelect} />
            </div>
          )}

          {currentItem && currentItem.id === "temperature" && (
            <TemperatureInput onSubmit={handleTemperatureSubmit} onSkip={handleTemperatureSkip} />
          )}

          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}

function TemperatureInput({ onSubmit, onSkip }: { onSubmit: (temp: string) => void; onSkip: () => void }) {
  const [temp, setTemp] = useState("");

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (temp.trim()) {
      onSubmit(temp.trim());
    }
  };

  return (
    <div className="ml-10 flex flex-col gap-2 max-w-[70%] items-end">
      <input
        type="number"
        step="0.01"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-full border border-brandAccentAlt rounded-bubble px-3 py-2 text-sm"
        placeholder="36.50"
      />
      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={onSkip}
          className="text-xs text-brandMuted underline hover:text-brandText"
        >
          スキップ
        </button>
        <button onClick={handleSubmit} className="text-xs px-4 py-2 bg-brandAccent text-white rounded-button shadow-sm">
          決定
        </button>
      </div>
    </div>
  );
}
