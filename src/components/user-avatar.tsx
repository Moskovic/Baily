/**
 * Deterministic abstract avatar based on a string (name/email).
 * Generates a unique gradient from the input — no external service needed.
 */

const GRADIENTS = [
  ["#7c3aed", "#c026d3"], // violet → fuchsia
  ["#2563eb", "#7c3aed"], // blue → violet
  ["#0891b2", "#2563eb"], // cyan → blue
  ["#059669", "#0891b2"], // emerald → cyan
  ["#d97706", "#dc2626"], // amber → red
  ["#dc2626", "#c026d3"], // red → fuchsia
  ["#7c3aed", "#2563eb"], // violet → blue
  ["#0891b2", "#059669"], // cyan → emerald
  ["#c026d3", "#dc2626"], // fuchsia → red
  ["#2563eb", "#059669"], // blue → emerald
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  const hash = hashString(name);
  const [from, to] = GRADIENTS[hash % GRADIENTS.length];
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initials}
    </div>
  );
}
