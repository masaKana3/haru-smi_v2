import { CalendarEntry } from "../components/calendar/CalendarGrid";
import { DailyAnswerValue, DailyAnswers, DailyRecord, DailySeverity } from "../types/daily";

const SEVERITY_COLORS: Record<DailySeverity, string> = {
  強い: "bg-brandAccent",
  "中くらい": "bg-brandAccentAlt",
  弱い: "bg-brandAccentAlt2",
  無い: "bg-brandMuted",
};

const SEVERITY_PRIORITY: DailySeverity[] = ["強い", "中くらい", "弱い", "無い"];

function isDailySeverity(value: DailyAnswerValue | undefined): value is DailySeverity {
  return value === "強い" || value === "中くらい" || value === "弱い" || value === "無い";
}

export function extractSeverity(answers: DailyAnswers): DailySeverity | undefined {
  const severities = Object.values(answers).filter(isDailySeverity) as DailySeverity[];
  for (const level of SEVERITY_PRIORITY) {
    if (severities.includes(level)) return level;
  }
  return undefined;
}

export function hasBleeding(answers: DailyAnswers): boolean {
  const bleeding = answers.bleeding;
  return bleeding != null && bleeding !== "無い";
}

export function buildCalendarEntries(records: DailyRecord[]): Record<string, CalendarEntry> {
  const map: Record<string, CalendarEntry> = {};
  records.forEach((rec) => {
    const severity = extractSeverity(rec.answers);
    map[rec.date] = {
      date: rec.date,
      severityColor: severity ? SEVERITY_COLORS[severity] : undefined,
      hasBleeding: hasBleeding(rec.answers),
    };
  });
  return map;
}
