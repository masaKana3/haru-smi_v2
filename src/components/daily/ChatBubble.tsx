import React from "react";

type ChatBubbleProps = {
  from: "bot" | "user";
  text: string;
  avatarUrl?: string;
};

export default function ChatBubble({ from, text, avatarUrl }: ChatBubbleProps) {
  const isBot = from === "bot";

  return (
    <div
      className={`mb-3 flex items-start gap-2 ${
        isBot ? "justify-start" : "justify-end flex-row-reverse"
      }`}
    >
      {/* アイコン */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
        {isBot ? (
          <img
            src="http://flat-icon-design.com/f/f_object_86/s512_f_object_86_0bg.png"
            alt="Bot Avatar"
            className="w-full h-full object-cover"
          />
        ) : avatarUrl && avatarUrl.startsWith("http") ? (
          <img
            src={avatarUrl}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-300" />
        )}
      </div>

      {/* テキスト */}
      <div className="max-w-[80%]">
        <div className="bg-white rounded-bubble px-3 py-2 shadow-sm text-sm leading-relaxed text-brandTextStrong">
          {text}
        </div>
      </div>
    </div>
  );
}
