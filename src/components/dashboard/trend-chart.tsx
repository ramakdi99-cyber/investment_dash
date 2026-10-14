import { useMemo, useState } from "react";
import { useElementWidth } from "@/lib/hooks";
import { formatNumber } from "@/lib/format";

export interface TrendPoint {
  date: Date;
  received: number;
  converted: number;
}

const DAY_LABEL = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric" });
const TOOLTIP_DATE = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/**
 * The single trend visualization. Hand-rolled SVG (no chart dependency):
 * a cobalt area for leads received, a faint dashed green line for conversions,
 * quiet gridlines, and an inspectable tooltip that follows the pointer.
 * Totals are annotated at the end of each series.
 */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const chart = useMemo(() => {
    const height = 240;
    const padTop = 18;
    const padBottom = 28;
    const padX = 10;
    const innerHeight = height - padTop - padBottom;

    const rawMax = Math.max(6, ...data.map((point) => point.received));
    const yMax = Math.ceil(rawMax / 2) * 2;

    const stepX =
      width > 8 && data.length > 1
        ? (width - padX * 2) / (data.length - 1)
        : 0;

    const x = (index: number) => padX + index * stepX;
    const y = (value: number) => padTop + innerHeight * (1 - value / yMax);

    const receivedPoints = data.map((point, index) => ({ x: x(index), y: y(point.received) }));
    const convertedPoints = data.map((point, index) => ({ x: x(index), y: y(point.converted) }));

    const linePath = (points: { x: number; y: number }[]) =>
      points
        .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
        .join(" ");

    const areaPath = (points: { x: number; y: number }[]) => {
      const first = points[0];
      const last = points[points.length - 1];
      const baseline = padTop + innerHeight;
      return `${linePath(points)} L${last.x.toFixed(1)},${baseline} L${first.x.toFixed(1)},${baseline} Z`;
    };

    const gridlines = Array.from({ length: 5 }).map((_, index) => {
      const value = Math.round((yMax / 4) * (4 - index));
      return { value, y: y(value) };
    });

    const totalReceived = data.reduce((sum, point) => sum + point.received, 0);
    const totalConverted = data.reduce((sum, point) => sum + point.converted, 0);

    return {
      height,
      padTop,
      padX,
      innerHeight,
      yMax,
      stepX,
      areaPath: areaPath(receivedPoints),
      linePath: linePath(receivedPoints),
      convertedLinePath: linePath(convertedPoints),
      receivedPoints,
      gridlines,
      totalReceived,
      totalConverted,
    };
  }, [data, width]);

  const handleMove = (clientX: number) => {
    if (chart.stepX <= 0 || data.length === 0) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const index = Math.round((clientX - rect.left - chart.padX) / chart.stepX);
    setHover(Math.max(0, Math.min(data.length - 1, index)));
  };

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && data.length > 0 ? (
        <svg
          role="img"
          aria-label="Leads received per day over the last 14 days"
          width={width}
          height={chart.height}
          className="block"
        >
          <defs>
            <linearGradient id="cobalt-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0047AB" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0047AB" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {chart.gridlines.map((line) => (
            <g key={line.value}>
              <line
                x1={chart.padX}
                x2={width - chart.padX}
                y1={line.y}
                y2={line.y}
                stroke="#EDEEF2"
                strokeDasharray="3 4"
              />
              <text x={width - chart.padX - 2} y={line.y - 5} textAnchor="end" className="fill-ink-subtle" fontSize="10">
                {formatNumber(line.value)}
              </text>
            </g>
          ))}

          <path d={chart.areaPath} fill="url(#cobalt-fill)" />
          <path
            d={chart.linePath}
            fill="none"
            stroke="#0047AB"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={chart.convertedLinePath}
            fill="none"
            stroke="#15803D"
            strokeOpacity="0.6"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {data.map((point, index) => (
            <text
              key={point.date.toISOString()}
              x={chart.padX + index * chart.stepX}
              y={chart.height - 8}
              textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
              className="fill-ink-subtle"
              fontSize="10"
            >
              {index % 2 === 0 || index === data.length - 1 ? DAY_LABEL.format(point.date) : ""}
            </text>
          ))}

          {/* end-of-series totals */}
          <text x={width - chart.padX} y={chart.padTop + 2} textAnchor="end" fontSize="10" fontWeight="600" className="tabular" fill="#0047AB">
            {chart.totalReceived} leads
          </text>
          <text x={width - chart.padX} y={chart.padTop + 14} textAnchor="end" fontSize="10" fontWeight="600" className="tabular" fill="#15803D">
            {chart.totalConverted} converted
          </text>

          <rect
            x={0}
            y={0}
            width={width}
            height={chart.height}
            fill="transparent"
            onMouseMove={(event) => handleMove(event.clientX)}
            onMouseLeave={() => setHover(null)}
          />

          {hover !== null && data[hover] ? (
            <g pointerEvents="none">
              <line
                x1={chart.receivedPoints[hover].x}
                x2={chart.receivedPoints[hover].x}
                y1={chart.padTop}
                y2={chart.padTop + chart.innerHeight}
                stroke="#0047AB"
                strokeOpacity="0.35"
              />
              <circle
                cx={chart.receivedPoints[hover].x}
                cy={chart.receivedPoints[hover].y}
                r="4"
                fill="#0047AB"
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height: 240 }} aria-hidden="true" />
      )}

      {hover !== null && data[hover] ? (
        <div
          role="status"
          style={{
            left: `${Math.max(10, Math.min(90, (chart.receivedPoints[hover].x / Math.max(width, 1)) * 100))}%`,
          }}
          className="pointer-events-none absolute top-3 z-10 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-2xs shadow-raised"
        >
          <span className="block whitespace-nowrap font-medium text-white">
            {TOOLTIP_DATE.format(data[hover].date)}
          </span>
          <span className="block whitespace-nowrap text-white/70">
            {formatNumber(data[hover].received)} received · {formatNumber(data[hover].converted)} converted
          </span>
        </div>
      ) : null}
    </div>
  );
}