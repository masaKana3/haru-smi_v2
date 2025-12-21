// -------------------------------------------------------
// レシピ生成ロジック（Gemini 2.0 Flash 用）
// -------------------------------------------------------

import { generateRecipeFromAI, RecipeInput } from "../../api/geminiRecipe";
import { WeatherData } from "../../api/weather";
import { DailyAnswers } from "../../types/daily";

// geminiRecipe.ts が export しないため、このファイルで定義する
const FALLBACK_RECIPE =
  "今日は体があたたまるスープなど、消化にやさしいものがおすすめです。";

// -------------------------------------------------------
// キャッシュユーティリティ
// -------------------------------------------------------

function getCacheKey(dateLabel: string): string {
  return `haru_recipe_${dateLabel}`;
}

function readCache(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeCache(key: string, value: string) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    // UI を止めない
  }
}

// -------------------------------------------------------
// 日付ラベル（YYYY-MM-DD）
// -------------------------------------------------------

function deriveDateLabel(weather: WeatherData): string {
  const t = weather?.time;

  if (typeof t === "string" && t.length >= 10) {
    return t.slice(0, 10);
  }

  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// -------------------------------------------------------
// 天気と症状からレシピ入力を組成
// -------------------------------------------------------

function toRecipeInput(
  weather: WeatherData,
  symptoms: DailyAnswers
): RecipeInput {
  const apparentTemp = Number.isFinite(weather.apparent_temperature)
    ? weather.apparent_temperature
    : weather.temperature_2m;

  const tempCategory: RecipeInput["tempCategory"] =
    apparentTemp <= 12 ? "cold" : "normal";

  const pressureCategory: RecipeInput["pressureCategory"] =
    weather.surface_pressure < 1007 ? "low" : "normal";

  const moodCategory: RecipeInput["moodCategory"] =
    symptoms.mood === "とても落ち込んだ" || symptoms.mood === "少し落ち込んだ"
      ? "down"
      : "OK";

  const fatigueCategory: RecipeInput["fatigueCategory"] =
    symptoms.fatigue === "かなり疲れている" ||
    symptoms.fatigue === "少し疲れている"
      ? "tired"
      : "normal";

  const bleeding =
    symptoms.bleeding === "多い" || symptoms.bleeding === "少量";

  const headache =
    symptoms.headache === "強い" || symptoms.headache === "中くらい";

  return {
    tempCategory,
    pressureCategory,
    moodCategory,
    fatigueCategory,
    bleeding,
    headache,
  };
}

// -------------------------------------------------------
// メイン：レシピ取得 ＋ キャッシュ制御
// -------------------------------------------------------

export async function getOrGenerateRecipe(
  weather: WeatherData,
  symptoms: DailyAnswers
): Promise<string> {
  if (!weather || !symptoms) {
    return FALLBACK_RECIPE;
  }

  const dateLabel = deriveDateLabel(weather);
  const cacheKey = getCacheKey(dateLabel);

  // キャッシュがあれば使う
  const cached = readCache(cacheKey);
  if (cached) return cached;

  try {
    const input = toRecipeInput(weather, symptoms);
    const recipe = await generateRecipeFromAI(input, dateLabel);// ★変更: 現在のAPIは安全モードでFALLBACKのみ返す

    const finalRecipe =
      typeof recipe === "string" && recipe.trim().length > 0
        ? recipe
        : FALLBACK_RECIPE;

    // 正常に生成されたレシピだけキャッシュ
    if (finalRecipe !== FALLBACK_RECIPE) {
      writeCache(cacheKey, finalRecipe);
    }

    return finalRecipe;
  } catch {
    return FALLBACK_RECIPE; // ★変更: 失敗時はシンプルにフォールバック
  }
}
