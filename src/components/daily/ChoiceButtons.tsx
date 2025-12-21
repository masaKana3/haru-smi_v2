import React from "react";

type ChoiceButtonsProps<T extends string> = {
  options: T[];
  onSelect: (value: T) => void;
  className?: string;
};

export default function ChoiceButtons<T extends string>({
  options,
  onSelect,
  className = "",
}: ChoiceButtonsProps<T>) {
  return (
    <div className={`ml-10 flex flex-col gap-2 max-w-[70%] ${className}`}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="w-full text-left bg-white rounded-bubble px-3 py-2 shadow-sm text-xs text-brandTextStrong active:scale-[0.98] transition-transform"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
