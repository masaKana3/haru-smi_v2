import React from "react";
import { DailyRecord } from "../../types/daily";

type Props = {
  records: DailyRecord[];
};

export default function TemperatureChart({ records }: Props) {
  // 日付順にソートして、体温があるものだけ抽出
  const data = records
    .filter((r) => r.answers.temperature)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-7); // 直近7件

  if (data.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-xs text-brandMuted bg-brandPanel rounded-card">
        基礎体温の記録がありません
      </div>
    );
  }

  const width = 300;
  const height = 160;
  const paddingX = 30;
  const paddingY = 20;

  // 体温の範囲を決定 (min-0.3 ~ max+0.3 くらい)
  const temps = data.map((d) => parseFloat(d.answers.temperature || "0"));
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  
  // Y軸のスケール計算
  const yMin = Math.floor(minTemp * 10) / 10 - 0.2;
  const yMax = Math.ceil(maxTemp * 10) / 10 + 0.2;
  const yRange = yMax - yMin || 1; // 0除算防止

  const getY = (temp: number) => {
    const ratio = (temp - yMin) / yRange;
    return (height - paddingY) - ratio * (height - 2 * paddingY);
  };

  const getX = (index: number) => {
    if (data.length <= 1) return width / 2;
    const step = (width - 2 * paddingX) / (data.length - 1);
    return paddingX + step * index;
  };

  const points = data
    .map((d, i) => {
      const t = parseFloat(d.answers.temperature || "0");
      return `${getX(i)},${getY(t)}`;
    })
    .join(" ");

  return (
    <div className="w-full flex justify-center bg-white rounded-card p-4 shadow-sm">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* グリッド線 (上限・下限・中間) */}
        {[yMin, (yMin + yMax) / 2, yMax].map((val) => (
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
              {val.toFixed(1)}
            </text>
          </g>
        ))}

        {/* 折れ線 */}
        <polyline
          fill="none"
          stroke="#FFB7B2" 
          strokeWidth="2"
          points={points}
        />

        {/* データ点 */}
        {data.map((d, i) => {
          const t = parseFloat(d.answers.temperature || "0");
          const x = getX(i);
          const y = getY(t);
          const dateObj = new Date(d.date);
          const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

          return (
            <g key={d.date}>
              <circle cx={x} cy={y} r="4" fill="#FFB7B2" stroke="#fff" strokeWidth="2" />
              <text x={x} y={height - 5} fontSize="10" fill="#60626B" textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}