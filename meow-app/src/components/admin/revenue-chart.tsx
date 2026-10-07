/**
 * Weekly revenue, stacked by channel. Plain server-rendered SVG: no client JS,
 * no resize observers, and it scales with its container via viewBox.
 * Hover tooltips come from native <title> elements.
 */
const COLORS: Record<string, string> = {
  TEMPLATES: "var(--chart-1)",
  KITS: "var(--chart-2)",
  MERCH: "var(--chart-4)",
  COMMISSIONS: "var(--chart-5)",
  MEMBERSHIPS: "var(--chart-7)",
  TIPS: "var(--chart-3)",
  GIFT_CARDS: "var(--chart-6)",
};

export function RevenueChart({ data, channels, labels }: { data: Record<string, number | string>[]; channels: string[]; labels: Record<string, string> }) {
  const W = 800;
  const H = 260;
  const pad = { top: 10, right: 8, bottom: 28, left: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const totals = data.map((d) => channels.reduce((a, c) => a + Number(d[c] ?? 0), 0));
  const rawMax = Math.max(1, ...totals);
  const step = 10 ** Math.floor(Math.log10(rawMax));
  const max = Math.ceil(rawMax / step) * step;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.max(4, Math.min(36, slot * 0.7));
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const labelEvery = Math.ceil(data.length / 10);

  return (
    <figure className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Weekly revenue by channel">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.12} strokeDasharray="3 3" />
            <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.6}>
              ${t.toLocaleString()}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2;
          let acc = 0;
          return (
            <g key={i}>
              {channels.map((c) => {
                const v = Number(d[c] ?? 0);
                if (v <= 0) return null;
                const top = y(acc + v);
                const h = y(acc) - top;
                acc += v;
                return (
                  <rect key={c} x={x} y={top} width={barW} height={Math.max(0, h)} fill={COLORS[c] ?? "var(--chart-1)"}>
                    <title>{`${d.week} · ${labels[c] ?? c}: $${v.toFixed(2)}`}</title>
                  </rect>
                );
              })}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.6}>
                  {String(d.week)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {channels.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: COLORS[c] }} aria-hidden="true" />
            {labels[c] ?? c}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
