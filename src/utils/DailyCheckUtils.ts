import { DailyAnswerValue, DailyQuestionId } from "../types/daily";

// Return choices per daily check item id
export function getOptionsForItemId(id: DailyQuestionId): DailyAnswerValue[] {
  if (id === "fatigue") {
    return ["かなり疲れている", "少し疲れている", "普通", "元気"];
  }
  if (id === "sleep") {
    return ["とても良い", "良い", "普通", "悪い"];
  }
  if (id === "mood") {
    return ["とても落ち込んだ", "少し落ち込んだ", "普通", "安定していた"];
  }
  return ["強い", "中くらい", "弱い", "無い"];
}
