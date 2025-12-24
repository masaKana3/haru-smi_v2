export type DailySeverity = "強い" | "中くらい" | "弱い" | "無い";

export type DailyAnswerValue =
  | DailySeverity
  | "かなり疲れている"
  | "少し疲れている"
  | "普通"
  | "元気"
  | "とても良い"
  | "良い"
  | "悪い"
  | "とても落ち込んだ"
  | "少し落ち込んだ"
  | "安定していた"
  | "少量"
  | "多い"
  | string; // ← 任意の文字列（体温など）を許容するように変更

export type DailyQuestionId =
  | "hotflash"
  | "sweat"
  | "sleep"
  | "fatigue"
  | "pain"
  | "cold"
  | "mood"
  | "irritability"
  | "condition"
  | "palpitation"
  | "bleeding"
  | "headache"
  | "shoulder"
  | "temperature" // ← 追加
  | string;

export interface DailyQuestion {
  id: DailyQuestionId;
  label: string;
  question: string;
  choices: string[];
}

export interface DailyAnswers {
  hotflash?: DailyAnswerValue;
  sweat?: DailyAnswerValue;
  sleep?: DailyAnswerValue;
  fatigue?: DailyAnswerValue;
  pain?: DailyAnswerValue;
  cold?: DailyAnswerValue;
  mood?: DailyAnswerValue;
  irritability?: DailyAnswerValue;
  condition?: DailyAnswerValue;
  palpitation?: DailyAnswerValue;
  bleeding?: DailyAnswerValue;
  headache?: DailyAnswerValue;
  shoulder?: DailyAnswerValue;
  temperature?: string; // ← 追加 (数値入力だが文字列として保持)
  [key: string]: DailyAnswerValue | string | undefined;
}

export interface DailyRecord {
  date: string;
  answers: DailyAnswers;
  items?: DailyQuestion[];
}
