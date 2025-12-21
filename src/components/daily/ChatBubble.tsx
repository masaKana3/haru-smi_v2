import React from "react";

type ChatBubbleProps = {
  from: "bot" | "user";
  text: string;
};

export default function ChatBubble({ from, text }: ChatBubbleProps) {
  const isBot = from === "bot";

  return (
    <div
      className={`mb-3 flex ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot ? (
        <div className="flex items-start gap-2 max-w-[80%]">
          <div className="w-8 h-8 rounded-full bg-brandAccent" />
          <div className="bg-white rounded-bubble px-3 py-2 shadow-sm text-sm leading-relaxed text-brandTextStrong">
            {text}
          </div>
        </div>
      ) : (
        <div className="max-w-[80%]">
          <div className="bg-white rounded-bubble px-3 py-2 shadow-sm text-sm leading-relaxed text-brandTextStrong">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}
