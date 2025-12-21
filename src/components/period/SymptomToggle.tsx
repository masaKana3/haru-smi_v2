import React from "react";

type SymptomToggleProps = {
  label: string;
  active: boolean;
  onToggle: () => void;
};

export default function SymptomToggle({ label, active, onToggle }: SymptomToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`py-2 px-3 rounded-[12px] text-xs border ${
        active
          ? "bg-brandAccent text-white"
          : "bg-brandInput text-brandText"
      }`}
    >
      {label}
    </button>
  );
}
