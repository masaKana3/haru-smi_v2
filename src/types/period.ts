export type PeriodBleedingLevel = "少ない" | "普通" | "多い";

export interface PeriodSymptoms {
  cramp: boolean;
  backpain: boolean;
  headache: boolean;
  nausea: boolean;
  fatigue: boolean;
  mood: boolean;
  irritability: boolean;
  breastPain: boolean;
}

export interface PeriodRecord {
  start: string;
  bleeding: PeriodBleedingLevel;
  symptoms: PeriodSymptoms;
  memo?: string;
}