import { DailyRecord } from "../types/daily";

export const calculateDailyScore = (record: DailyRecord): number => {
  let dailyScore = 100;
  Object.entries(record.answers).forEach(([key, value]) => {
    if (["temperature", "bleeding", "hospital_visit", "medication_change", "blood_test_note"].includes(key)) return;
    if (value === "強い") dailyScore -= 15;
    else if (value === "中くらい") dailyScore -= 10;
    else if (value === "弱い") dailyScore -= 5;
  });
  return Math.max(0, dailyScore);
};