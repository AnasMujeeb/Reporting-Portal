export default function RiskBadge({ riskLevel, matrixCode }) {
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
    Yellow: {
      className: "risk-yellow",
      label: "Medium Risk",
      icon: "🟡",
    },
    Green: {
      className: "risk-green",
      label: "Acceptable",
      icon: "🟢",
    },
    "Not Assessed": {
      className: "risk-not-assessed",
      label: "Not Assessed",
      icon: "⚪",
    },
  };

  const entry = config[riskLevel];
  if (!entry) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${entry.className}`}
      title={`Risk: ${entry.label}${matrixCode ? ` (${matrixCode})` : ""}`}
    >
      <span className="text-[8px]">{entry.icon}</span>
      {entry.label}
      {matrixCode && (
        <span className="matrix-code-badge">{matrixCode}</span>
      )}
    </span>
  );
}
