export function durationMs(value: string | undefined, fallback: string): number {
  const raw = value ?? fallback;
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(raw);
  if (!match) throw new Error(`Invalid duration: ${raw}`);
  const amount = Number(match[1]);
  const multiplier = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    match[2] as "ms" | "s" | "m" | "h" | "d"
  ];
  return amount * multiplier;
}
