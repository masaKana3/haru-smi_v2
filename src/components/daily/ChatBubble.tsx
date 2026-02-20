import React from "react";
import { ICONS, DEFAULT_ICON, BOT_ICON } from "../../lib/constants";

type ChatBubbleProps = {
  from: "bot" | "user";
  text: string;
  avatarUrl?: string;
};

export default function ChatBubble({ from, text, avatarUrl }: ChatBubbleProps) {
  const isBot = from === "bot";

  const getAvatarSrc = () => {
    if (isBot) {
      return BOT_ICON;
    }
    if (avatarUrl && ICONS[avatarUrl]) {
      return ICONS[avatarUrl];
    }
    return DEFAULT_ICON;
  };

  return (
    <div
      className={`mb-3 flex items-start gap-2 ${
        isBot ? "justify-start" : "justify-end flex-row-reverse"
      }`}
    >
      {/* アイコン */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
        <img
          src={getAvatarSrc()}
          alt={isBot ? "Bot Avatar" : "User Avatar"}
          className="w-full h-full object-cover"
        />
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
