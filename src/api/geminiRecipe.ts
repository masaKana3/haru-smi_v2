// --------------------------------------------
// Gemini 1.5 Flash 版 レシピ生成API（完全動作版）
// ※現在は安全モード: ダミーレシピのみ返す
// --------------------------------------------

export interface RecipeInput {
  tempCategory: "cold" | "normal";
  pressureCategory: "low" | "normal";
  moodCategory: "down" | "OK";
  fatigueCategory: "tired" | "normal";
  bleeding: boolean;
  headache: boolean;
}

export const FALLBACK_RECIPE =
  "今日は体があたたまるスープなど、消化にやさしいものがおすすめです。";

// -----------------------------
// Gemini 1.5 Flash: レシピ生成API
// -----------------------------
export async function generateRecipeFromAI(
  input: RecipeInput,
  dateLabel: string // ←⭐ 日付キーを受け取り保存に使う
): Promise<string> {
  // --------------------------------------------------
  // ★ 現在は安全モード：常にダミーのレシピを返す
  // --------------------------------------------------
  const dummy = FALLBACK_RECIPE;

  // ⭐ localStorage 保存を必ず行う
  try {
    const key = `recipe_${dateLabel}`;
    localStorage.setItem(key, dummy);
    console.log(`💾 Dummy recipe saved: ${key}`);
  } catch (e) {
    console.error("❌ Failed to save dummy recipe:", e);
  }

  return dummy;

  // 【将来復元用】以下のコードはGemini API復旧時に戻してください
  // const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  // if (!apiKey) {
  //   console.error("❌ Gemini API Key が設定されていません");
  //   return FALLBACK_RECIPE;
  // }
  //
  // const prompt = `
  // あなたは専門の管理栄養士です。
  // 気温・気圧・体調情報に基づいて、温かくて消化にやさしい日本の家庭料理レシピを1つだけ提案してください。
  //
  // 【条件】
  // - 寒い日は温かい料理を必ず選ぶ（冷奴・サラダは選ばない）
  // - 材料は3〜5個
  // - 手順は3〜6ステップ
  // - 出力は「タイトル」「材料」「手順」だけ
  // - 余計な会話や説明は書かない
  //
  // 【体調】
  // - 気温: ${input.tempCategory}
  // - 気圧: ${input.pressureCategory}
  // - 気分: ${input.moodCategory}
  // - 疲労: ${input.fatigueCategory}
  // - 出血: ${input.bleeding}
  // - 頭痛: ${input.headache}
  //
  // レシピを1つだけ生成してください。
  // `;
  //
  // try {
  //   const res = await fetch(
  //     `https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  //     {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         contents: [{ parts: [{ text: prompt }] }],
  //       }),
  //     }
  //   );
  //
  //   const data = await res.json();
  //   console.log("🔎 GEMINI_RAW_RESPONSE", data);
  //
  //   if (!res.ok) {
  //     console.error("❌ Gemini API Error:", data);
  //     return FALLBACK_RECIPE;
  //   }
  //
  //   const extracted = extractText(data);
  //   return extracted.length > 0 ? extracted : FALLBACK_RECIPE;
  // } catch (err) {
  //   console.error("❌ Gemini exception:", err);
  //   return FALLBACK_RECIPE;
  // }
}
