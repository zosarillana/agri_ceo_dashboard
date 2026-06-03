export const getTodayISO = () => new Date().toLocaleDateString("en-CA");
export const toISO = (d: Date) => new Date(d).toLocaleDateString("en-CA");
export const toMonthKey = (s: string) => s.slice(0, 7);
export const currentMonthKey = () => toMonthKey(getTodayISO());

export const fmt = (n: number) => n.toLocaleString();

export const fmtUSD = (n: number) =>
  "$" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtPHP = (n: number) =>
  "₱" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const fmtMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });
};

export function relativeTime(date: Date) {
  const now = new Date();

  // Compare calendar dates only, ignoring time-of-day drift
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thatDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const days = Math.round(
    (todayDate.getTime() - thatDate.getTime()) / 86_400_000,
  );

  if (days === 0) {
    const mins = Math.floor((now.getTime() - date.getTime()) / 60_000);
    const hours = Math.floor(mins / 60);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${hours}h ago`;
  }
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}