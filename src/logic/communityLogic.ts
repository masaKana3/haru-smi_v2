import { Topic } from "../types/community";

const topics: Topic[] = [
  { id: "t1", title: "毎日の小さな工夫", description: "生活リズムやセルフケアのアイデア共有" },
  { id: "t2", title: "体験談を聞かせて", description: "症状との向き合い方や乗り越え方" },
  { id: "t3", title: "質問・相談コーナー", description: "気になることを気軽に聞いてみましょう" },
];

export function getTopics(): Topic[] {
  return topics;
}
