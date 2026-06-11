/**
 * RiskBadge — displays the ICAO risk level as a colored badge.
 * Only renders when riskLevel is a valid value (Red, Orange, Green).
 * Used in table rows alongside the StatusBadge component.
 */
export default function RiskBadge({ riskLevel }) {
  if (!riskLevel) return null;

  const config = {
    Red: {
      className: "risk-red",
      label: "High Risk",
      icon: "🔴",
    },
    Orange: {
      className: "risk-orange",
      label: "Tolerable",
      icon: "🟠",
    },
    Green: {
      className: "risk-green",
      label: "Acceptable",
      icon: "🟢",
    },
  };

  const entry = config[riskLevel];
  if (!entry) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${entry.className}`}
      title={`ICAO Risk: ${entry.label}`}
    >
      <span className="text-[8px]">{entry.icon}</span>
      {entry.label}
    </span>
  );
}
