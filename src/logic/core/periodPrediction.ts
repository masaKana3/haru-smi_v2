import { PeriodRecord } from "../../types/period";

// 将来的にAIモデルの設定などをここに持たせるための構成
export type PredictionConfig = {
  method: "simple_average" | "ai_model"; // 拡張用フラグ
  defaultCycle: number;
};

export type PredictionResult = {
  nextPeriodDate: string | null; // YYYY-MM-DD
  daysUntilNext: number | null;  // 今日からあと何日か（マイナスは予定日超過）
  estimatedCycleLength: number;  // 推定された周期日数
};

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal" | "unknown";

export type PhaseInfo = {
  phase: CyclePhase;
  dayInCycle: number;
};

const DEFAULT_CONFIG: PredictionConfig = {
  method: "simple_average",
  defaultCycle: 28,
};

function toDate(dateStr: string): Date {
  return new Date(dateStr);
}

function diffDays(d1: Date, d2: Date): number {
  const t1 = d1.getTime();
  const t2 = d2.getTime();
  return Math.ceil((t2 - t1) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = ("0" + (date.getMonth() + 1)).slice(-2);
  const d = ("0" + date.getDate()).slice(-2);
  return `${y}-${m}-${d}`;
}

export function predictNextPeriod(
  history: PeriodRecord[],
  config: PredictionConfig = DEFAULT_CONFIG
): PredictionResult {
  // 日付順にソート（新しい順）
  const sorted = [...history].sort((a, b) => (a.start < b.start ? 1 : -1));

  if (sorted.length === 0) {
    return {
      nextPeriodDate: null,
      daysUntilNext: null,
      estimatedCycleLength: config.defaultCycle,
    };
  }

  const latest = sorted[0];
  const latestDate = toDate(latest.start);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  latestDate.setHours(0, 0, 0, 0);

  let cycleLength = config.defaultCycle;

  // 履歴が2件以上あれば、直近のデータから平均周期を計算する
  if (sorted.length >= 2) {
    let sumDiff = 0;
    let count = 0;
    // 直近6回分程度を見る
    const maxSamples = Math.min(sorted.length - 1, 6);
    
    for (let i = 0; i < maxSamples; i++) {
      const current = toDate(sorted[i].start);
      const prev = toDate(sorted[i + 1].start);
      const diff = diffDays(prev, current);
      
      // 異常値除外 (20日未満、45日以上はスキップする簡易フィルタ)
      if (diff >= 20 && diff <= 45) {
        sumDiff += diff;
        count++;
      }
    }

    if (count > 0) {
      cycleLength = Math.round(sumDiff / count);
    }
  }

  const nextDate = addDays(latestDate, cycleLength);
  const daysUntil = diffDays(today, nextDate);

  return {
    nextPeriodDate: formatYMD(nextDate),
    daysUntilNext: daysUntil,
    estimatedCycleLength: cycleLength,
  };
}

export function getCyclePhase(
  lastPeriodStart: string | null,
  cycleLength: number = DEFAULT_CONFIG.defaultCycle
): PhaseInfo {
  if (!lastPeriodStart) {
    return { phase: "unknown", dayInCycle: 0 };
  }

  const start = toDate(lastPeriodStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const dayInCycle = diffDays(start, today) + 1; // 生理開始日を1日目とする

  let phase: CyclePhase = "unknown";

  if (dayInCycle >= 1 && dayInCycle <= 5) {
    phase = "menstrual"; // 生理中 (1-5日目)
  } else if (dayInCycle > 5 && dayInCycle <= cycleLength - 14 - 2) {
    phase = "follicular"; // 卵胞期 (生理終了後〜排卵2日前)
  } else if (dayInCycle > cycleLength - 14 - 2 && dayInCycle <= cycleLength - 14 + 2) {
    phase = "ovulatory"; // 排卵期 (排卵日±2日)
  } else if (dayInCycle > cycleLength - 14 + 2) {
    phase = "luteal"; // 黄体期 (排卵後〜次の生理)
  }

  return { phase, dayInCycle };
}