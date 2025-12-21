import React, { useEffect, useMemo, useState } from "react";
import CalendarGrid from "../components/calendar/CalendarGrid";
import { DailyRecord } from "../types/daily";
import { buildCalendarEntries } from "../utils/calendarEntries";
import { loadMenstrualMarkers } from "../logic/calendar/menstrualMarkers";

type Props = {
  onBack: () => void;
  onSelectDate: (date: string) => void;
  records?: DailyRecord[];
};

export default function HistoryScreen({
  onBack,
  onSelectDate,
  records: propRecords,
}: Props) {
  const [records, setRecords] = useState<DailyRecord[]>(propRecords ?? []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (propRecords && propRecords.length > 0) {
      setRecords(propRecords);
      return;
    }

    const list: DailyRecord[] = [];

    // localStorage のキーを全部走査して「haru_daily_」だけ拾う
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith("haru_daily_")) {
        const raw = localStorage.getItem(key);
        try {
          const parsed = raw ? (JSON.parse(raw) as DailyRecord) : null;
          if (parsed) {
            list.push(parsed);
          }
        } catch (e) {
          console.error("JSON parse error:", key);
        }
      }
    }

    // 日付の新しい順にソート
    list.sort((a, b) => (a.date > b.date ? -1 : 1));

    setRecords(list);
  }, [propRecords]);

  const calendarEntries = useMemo(() => buildCalendarEntries(records), [records]);
  const menstrualMarkers = useMemo(() => loadMenstrualMarkers(), [records]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    onSelectDate(date);
  };

  return (
    <div className="w-full min-h-screen bg-brandBg flex flex-col items-center p-6 text-brandText">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-brandMutedAlt">
            戻る
          </button>
          <h2 className="text-md font-semibold text-brandText">体調カレンダー</h2>
          <div className="w-12" />
        </div>

        <CalendarGrid
          entries={calendarEntries}
          menstrualMarkers={menstrualMarkers}
          selectedDate={selectedDate ?? undefined}
          onSelectDate={handleSelectDate}
        />

        {records.length === 0 && (
          <p className="text-xs text-center text-neutralText">
            過去の記録はありません。日々の記録をつけてみましょう。
          </p>
        )}
      </div>
    </div>
  );
}
