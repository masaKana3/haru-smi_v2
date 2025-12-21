import { DailyQuestion, DailyQuestionId } from "./daily";

export type SMIQuestionId =
  | "hotflash"
  | "sweat"
  | "cold"
  | "palpitation"
  | "sleep"
  | "irritability"
  | "mood"
  | "condition"
  | "fatigue"
  | "pain";

export type SMIAnswerValue = 0 | 1 | 2 | 3;
export type SMIAnswerLabel = "強い" | "中くらい" | "弱い" | "無い";

export type SMIAnswers = (SMIAnswerValue | null)[];

export interface SMIConvertedAnswer {
  id: SMIQuestionId;
  value: SMIAnswerLabel;
}

export interface SMIClusterResult {
  vmsStrong: boolean;
  physicalStrong: boolean;
  mentalStrong: boolean;
  coldStrong: boolean;
  headacheStrong: boolean;
}

export interface DailyQuestionDefinition extends Omit<DailyQuestion, "choices"> {
  choices?: string[];
  id: DailyQuestionId;
}
