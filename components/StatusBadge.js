export default function StatusBadge({ status }) {
  const config = {
    Pending: {
      className: "status-pending",
      icon: "⚠",
    },
    "Under Review": {
      className: "status-review",
      icon: "🔍",
    },
    Resolved: {
      className: "status-resolved",
      icon: "✓",
    },
  };

  const { className, icon } = config[status] || config["Pending"];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${className}`}
    >
      <span className="text-[10px]">{icon}</span>
      {status}
    </span>
  );
}
