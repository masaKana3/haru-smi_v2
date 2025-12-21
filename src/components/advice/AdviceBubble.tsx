import React from "react";

type AdviceBubbleProps = {
  text: string;
  className?: string;
};

export default function AdviceBubble({ text, className = "" }: AdviceBubbleProps) {
  return (
    <div className={`bg-brandBubble rounded-bubble px-4 py-3 text-sm leading-normal text-brandTextStrong shadow-sm max-w-xs ${className}`}>
      {text}
    </div>
  );
}
