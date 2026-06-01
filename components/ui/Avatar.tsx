interface AvatarProps {
  name: string;
  /** Optional photo URL. When missing, falls back to colored initials. */
  src?: string | null;
  size?: number;
  className?: string;
}

// Deterministic background palette — same student always gets the same color.
const PALETTE = [
  "#d97757", // terracotta
  "#7c8a4d", // olive
  "#5b6f8a", // slate
  "#a4724b", // tan
  "#8a5b8a", // muted plum
  "#3f6e6e", // teal
  "#b86b6b", // dusty red
  "#5d6b7d", // navy-grey
];

function hashToPaletteIndex(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, src, size = 36, className }: AvatarProps) {
  const bg = PALETTE[hashToPaletteIndex(name)];
  const dim = { width: size, height: size, fontSize: Math.round(size * 0.36) };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ring-1 ring-black/5 ${className ?? ""}`}
        style={dim}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ring-1 ring-black/10 ${className ?? ""}`}
      style={{ ...dim, backgroundColor: bg }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
