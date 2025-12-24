import React, { useMemo, useState } from "react";
import { MenstrualMarker } from "../../logic/calendar/menstrualMarkers";

export type CalendarEntry = {
  date: string;
  severityColor?: string;
  hasBleeding?: boolean;
};

type Props = {
  entries: Record<string, CalendarEntry>;
  menstrualMarkers?: Record<string, MenstrualMarker>;
  onSelectDate: (date: string) => void;
  onOpenPeriodInput?: () => void;
  selectedDate?: string;
  initialMonth?: Date;
};

type CalendarDay = {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
};

const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return startOfMonth(d);
}

function buildCalendarDays(monthDate: Date): CalendarDay[] {
  const start = startOfMonth(monthDate);
  const startWeekday = start.getDay();

  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  ).getDate();

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const firstCellDate = new Date(start);
  firstCellDate.setDate(1 - startWeekday);

  const days: CalendarDay[] = [];

  for (let i = 0; i < totalCells; i++) {
    const current = new Date(firstCellDate);
    current.setDate(firstCellDate.getDate() + i);

    days.push({
      date: current,
      dateString: formatDate(current),
      isCurrentMonth: current.getMonth() === monthDate.getMonth(),
    });
  }

  return days;
}

export default function CalendarGrid({
  entries,
  menstrualMarkers,
  onSelectDate,
  onOpenPeriodInput,
  selectedDate,
  initialMonth,
}: Props) {
  const [month, setMonth] = useState<Date>(
    () => startOfMonth(initialMonth ?? new Date())
  );

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const todayString = useMemo(() => formatDate(new Date()), []);

  const handleMonthChange = (delta: number) => {
    setMonth((prev) => addMonths(prev, delta));
  };

  const handleSelect = (day: CalendarDay) => {
    const isFuture = day.dateString > todayString;
    if (isFuture) return;
    if (!day.isCurrentMonth) {
      setMonth(startOfMonth(day.date));
    }
    onSelectDate(day.dateString);
  };

  const monthLabel = `${month.getFullYear()}年 ${month.getMonth() + 1}月`;

  return (
    <div className="bg-white rounded-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMonthChange(-1)}
            className="text-sm text-brandText px-3 py-1 rounded-full bg-brandPanel"
          >
            &lt;
          </button>
          <div className="text-sm font-semibold text-brandText">{monthLabel}</div>
          <button
            type="button"
            onClick={() => handleMonthChange(1)}
            className="text-sm text-brandText px-3 py-1 rounded-full bg-brandPanel"
          >
            &gt;
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenPeriodInput}
          className={`text-lg leading-none text-brandAccent hover:opacity-80 transition-opacity ${
            onOpenPeriodInput ? "" : "opacity-40 cursor-default"
          }`}
          aria-label="月経を記録する"
          disabled={!onOpenPeriodInput}
        >
          🩸
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-brandMuted mb-2">
        {dayLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const entry = entries[day.dateString];
          const menstrual = menstrualMarkers?.[day.dateString];
          const isSelected = selectedDate === day.dateString;
          const isToday = todayString === day.dateString;
          const isFuture = day.dateString > todayString;
          const isPeriodDay = menstrual?.isPeriod;
          const isStartDay = menstrual?.isStart;
          const isPredicted = menstrual?.isNextPredicted;
          const hasRecord = Boolean(entry);

          const cellBase =
            "relative h-16 rounded-lg flex flex-col items-center justify-start text-xs border transition-colors duration-150 pt-2";
          const currentMonthClass = day.isCurrentMonth
            ? "text-brandText border-transparent"
            : "text-brandMuted/60 border-transparent";

          // 1. 背景色の決定ロジックを改善
          const backgroundClass = isPeriodDay
            ? "bg-pink-50" // 2. 生理日を薄いピンクに
            : hasRecord
            ? "bg-brandAccentAlt/30" // 記録日は薄い紫に
            : "bg-brandPanel"; // デフォルト

          const selectedClass =
            isSelected ? "ring-2 ring-brandAccent" : "";
          // 1. 今日のスタイルを調整
          const todayClass = isToday
            ? "border-2 border-brandAccent"
            : "";
          const futureClass = isFuture ? "opacity-40 pointer-events-none" : "";

          return (
            <button
              key={day.dateString}
              type="button"
              onClick={() => handleSelect(day)}
              className={`${cellBase} ${currentMonthClass} ${backgroundClass} ${selectedClass} ${todayClass} ${futureClass}`}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-brandAccent font-bold' : ''}`}>{day.date.getDate()}</div>

              {/* 3. 体調の可視化（ドット） */}
              {hasRecord && entry.severityColor && (
                <div className={`absolute bottom-2 w-2 h-2 rounded-full ${entry.severityColor}`} />
              )}

              {isStartDay && (
                <span className="absolute top-1 right-1 text-[13px] z-10" aria-label="生理開始">
                  🔴
                </span>
              )}

              {isPredicted && (
                <span
                  className="absolute bottom-1 right-1 text-[13px] z-10"
                  aria-label="次の予測開始"
                >
                  🩷
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
