import { DailyQuestion, DailyQuestionId } from "../types/daily";
import {
  SMIAnswers,
  SMIAnswerLabel,
  SMIAnswerValue,
  SMIClusterResult,
  SMIConvertedAnswer,
  SMIQuestionId,
  DailyQuestionDefinition,
} from "../types/smi";

// --------------------------------------------------------------
// ■ SMI スコア表
// --------------------------------------------------------------
export const scoreTable: number[][] = [
  [10, 6, 3, 0], // Q1 ほてり
  [10, 6, 3, 0], // Q2 発汗
  [14, 9, 5, 0], // Q3 冷え
  [12, 8, 4, 0], // Q4 動悸・息切れ
  [14, 9, 4, 0], // Q5 睡眠
  [12, 8, 4, 0], // Q6 イライラ
  [7, 5, 3, 0],  // Q7 憂うつ
  [7, 5, 3, 0],  // Q8 頭痛・めまい・吐き気
  [7, 4, 2, 0],  // Q9 疲れやすさ
  [7, 5, 3, 0],  // Q10 肩こり・腰痛
];

const labelToIndex: Record<SMIAnswerLabel, SMIAnswerValue> = {
  "強い": 0,
  "中くらい": 1,
  "弱い": 2,
  "無い": 3,
};

// --------------------------------------------------------------
// ■ トータル SMI スコア
// --------------------------------------------------------------
export function calculateTotalSMIScore(answers: SMIAnswers): number {
  if (!answers || answers.length !== 10) return 0;

  return answers.reduce((sum: number, val, idx) => {
    if (val == null) return sum;
    return sum + scoreTable[idx][val];
  }, 0);
}

// --------------------------------------------------------------
// ■ クラスタ判定
// --------------------------------------------------------------
export function calculateClusters(answers: SMIConvertedAnswer[]): SMIClusterResult {
  const qScores = answers.map((v, idx) =>
    v == null ? 0 : scoreTable[idx][labelToIndex[v.value]]
  );

  return {
    vmsStrong: (qScores[0] || 0) + (qScores[1] || 0) >= 10,
    physicalStrong:
      (qScores[2] || 0) +
        (qScores[3] || 0) +
        (qScores[7] || 0) +
        (qScores[8] || 0) +
        (qScores[9] || 0) >= 14,
    mentalStrong:
      (qScores[4] || 0) +
        (qScores[5] || 0) +
        (qScores[6] || 0) >= 7,
    coldStrong: (qScores[2] || 0) >= 7,
    headacheStrong: (qScores[7] || 0) >= 7,
  };
}

// --------------------------------------------------------------
// ■ 全質問一覧 + ★毎日追加する出血質問
// --------------------------------------------------------------
export const QUESTION_DEFS: Record<DailyQuestionId, DailyQuestionDefinition> = {
  hotflash: {
    id: "hotflash",
    label: "ほてり",
    question: "今日は、ほてりはどんな感じでしたか？",
  },
  sweat: {
    id: "sweat",
    label: "汗のかきやすさ",
    question: "今日は、汗のかきやすさはどうでしたか？",
  },
  sleep: {
    id: "sleep",
    label: "睡眠の質",
    question: "昨夜の眠りの感じを教えてください。",
  },
  fatigue: {
    id: "fatigue",
    label: "疲れやすさ",
    question: "今日は、疲れやすさはどんな感じでしたか？",
  },
  pain: {
    id: "pain",
    label: "肩こり・痛み",
    question: "肩こりや痛み、今日はどのくらいありましたか？",
  },
  cold: {
    id: "cold",
    label: "冷え",
    question: "手足の冷えは、今日はどんな感じでしたか？",
  },
  palpitation: {
    id: "palpitation",
    label: "動悸・息切れ",
    question: "今日は、動悸や息切れはどんな感じでしたか？",
  },
  headache: {
    id: "headache",
    label: "頭痛・めまい・吐き気",
    question: "頭痛やめまいの感じ、今日はどうでしたか？",
  },
  mood: {
    id: "mood",
    label: "気分の落ち込み",
    question: "今日は、気分の落ち込みはありましたか？",
  },
  irritability: {
    id: "irritability",
    label: "イライラ",
    question: "今日は、イライラや怒りっぽさはありましたか？",
  },

  // ★ 新規追加 → 不正出血
  bleeding: {
    id: "bleeding",
    label: "出血",
    question: "今日、不正出血や少量でも出血はありましたか？",
    choices: ["無い", "少量", "普通", "多い"],
  },
};

// --------------------------------------------------------------
// ■ デイリー質問生成（完全版）
// --------------------------------------------------------------
export function generateDailyQuestions(cluster: SMIClusterResult): DailyQuestion[] {
  const {
    vmsStrong,
    physicalStrong,
    mentalStrong,
    coldStrong,
    headacheStrong,
  } = cluster;

  const result: DailyQuestionDefinition[] = [];

  const push = (item: DailyQuestionDefinition | undefined) => {
    if (!item) return;
    if (!result.find((i) => i.id === item.id)) result.push(item);
  };

  // ① ★ 毎日必ず聞く：出血
  push(QUESTION_DEFS.bleeding);

  // ② VMS（ほてり・汗・睡眠）
  if (vmsStrong) {
    push(QUESTION_DEFS.hotflash);
    push(QUESTION_DEFS.sweat);
    push(QUESTION_DEFS.sleep);
  }

  // ③ 身体症状
  if (physicalStrong) {
    push(QUESTION_DEFS.fatigue);
    push(QUESTION_DEFS.pain);
    push(QUESTION_DEFS.palpitation);

    if (coldStrong) push(QUESTION_DEFS.cold);
    if (headacheStrong) push(QUESTION_DEFS.headache);
  }

  // ④ メンタル
  if (mentalStrong) {
    push(QUESTION_DEFS.mood);
    push(QUESTION_DEFS.irritability);
    push(QUESTION_DEFS.sleep);
  }

  // ⑤ どのクラスタも弱い場合のフォールバック
  if (result.length === 1) {
    push(QUESTION_DEFS.fatigue);
    push(QUESTION_DEFS.sleep);
    push(QUESTION_DEFS.mood);
  }

  // 出血以外は通常の4択を設定
  return result.map<DailyQuestion>((q) => ({
    ...q,
    choices: q.choices || ["強い", "中くらい", "弱い", "無い"],
  }));
}
