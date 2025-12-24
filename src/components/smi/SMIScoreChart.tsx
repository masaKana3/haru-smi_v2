import React from "react";
import { SMIRecord } from "../../types/smi";

type Props = {
  history: SMIRecord[];
};

export default function SMIScoreChart({ history }: Props) {
  // 古い順にソート
  const sorted = [...history].sort((a, b) => (a.date > b.date ? 1 : -1));
  // 直近5件を表示（スマホ画面で見やすくするため）
  const data = sorted.slice(-5);

  if (data.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-xs text-brandMuted bg-brandPanel rounded-card">
        データがありません
      </div>
    );
  }

  const width = 300;
  const height = 160;
  const paddingX = 30;
  const paddingY = 20;

  // Y軸: 0〜100
  const getY = (score: number) => {
    // score 0 -> height - paddingY
    // score 100 -> paddingY
    const ratio = score / 100;
    return (height - paddingY) - ratio * (height - 2 * paddingY);
  };

  // X軸
  const getX = (index: number) => {
    if (data.length <= 1) return width / 2;
    const step = (width - 2 * paddingX) / (data.length - 1);
    return paddingX + step * index;
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.total)}`).join(" ");

  return (
    <div className="w-full flex justify-center bg-white rounded-card p-4 shadow-sm">
      <svg width="100%" height="160" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* グリッド線 (0, 50, 100) */}
        {[0, 50, 100].map((val) => (
          <g key={val}>
            <line
              x1={paddingX}
              y1={getY(val)}
              x2={width - paddingX}
              y2={getY(val)}
              stroke="#E0DCEC"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text x={paddingX - 5} y={getY(val) + 3} fontSize="10" fill="#999" textAnchor="end">
              {val}
            </text>
          </g>
        ))}

        {/* 折れ線 */}
        <polyline
          fill="none"
          stroke="#B59DC6"
          strokeWidth="2"
          points={points}
        />

        {/* データ点とラベル */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.total);
          const dateObj = new Date(d.date);
          const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

          return (
            <g key={d.date}>
              <circle cx={x} cy={y} r="4" fill="#B59DC6" stroke="#fff" strokeWidth="2" />
              <text x={x} y={height - 5} fontSize="10" fill="#60626B" textAnchor="middle">
                {label}
              </text>
              <text x={x} y={y - 8} fontSize="10" fill="#B59DC6" fontWeight="bold" textAnchor="middle">
                {d.total}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}