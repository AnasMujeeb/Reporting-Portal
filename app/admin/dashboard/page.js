"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, Fragment } from "react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import RiskBadge from "@/components/RiskBadge";
export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { value: "all", label: "All Departments" },
  { value: "flight_ops", label: "Flight Operations" },
  { value: "ground_ops", label: "Ground Operations" },
  { value: "maintenance", label: "Maintenance" },
  { value: "facilities", label: "Facilities" },
];

const STATUS_OPTIONS = ["Pending", "Under Review", "Resolved"];

const PROBABILITY_OPTIONS = [
  { value: 5, label: "5 — Frequent" },
  { value: 4, label: "4 — Occasional" },
  { value: 3, label: "3 — Remote" },
  { value: 2, label: "2 — Improbable" },
  { value: 1, label: "1 — Extremely Improbable" },
];

const SEVERITY_OPTIONS = [
  { value: "A", label: "A — Catastrophic" },
  { value: "B", label: "B — Hazardous" },
  { value: "C", label: "C — Major" },
  { value: "D", label: "D — Minor" },
  { value: "E", label: "E — Negligible" },
];

// Client-side mirror of the ICAO risk matrix for live preview
const RISK_MATRIX = {
  "5A": "Red", "5B": "Red", "5C": "Red", "5D": "Orange", "5E": "Orange",
  "4A": "Red", "4B": "Red", "4C": "Orange", "4D": "Orange", "4E": "Orange",
  "3A": "Red", "3B": "Orange", "3C": "Orange", "3D": "Orange", "3E": "Green",
  "2A": "Orange", "2B": "Orange", "2C": "Orange", "2D": "Green", "2E": "Green",
  "1A": "Orange", "1B": "Green", "1C": "Green", "1D": "Green", "1E": "Green",
};

function getPreviewRisk(probability, severity) {
  if (!probability || !severity) return null;
  return RISK_MATRIX[`${probability}${severity}`] || null;
}

const RISK_PREVIEW_CONFIG = {
  Red: {
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    text: "text-red-400",
    glow: "shadow-red-500/20",
    label: "HIGH RISK — Unacceptable",
    sublabel: "Immediate action required due to high threat or fatality risk",
    icon: "🔴",
  },
  Orange: {
    bg: "bg-orange-400/15",
    border: "border-orange-400/40",
    text: "text-orange-400",
    glow: "shadow-orange-400/20",
    label: "MEDIUM RISK — Tolerable",
    sublabel: "Admin must take mitigation actions and review",
    icon: "🟠",
  },
  Green: {
    bg: "bg-emerald-400/15",
    border: "border-emerald-400/40",
    text: "text-emerald-400",
    glow: "shadow-emerald-400/20",
    label: "LOW RISK — Acceptable",
    sublabel: "Minimal to no action needed, logged as safe",
    icon: "🟢",
  },
};

export default function AdminDashboard() {
  const { data: session, status } = useSession() || {};
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Risk assessment state per complaint (keyed by complaint _id)
  const [riskInputs, setRiskInputs] = useState({});

  const fetchComplaints = useCallback(async () => {
    try {
      const url =
        filter === "all"
          ? "/api/complaints"
          : `/api/complaints?category=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints);
      }
    } catch {
      console.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchComplaints();
    }
  }, [status, filter, fetchComplaints]);

  // Initialize risk inputs when a complaint is expanded
  useEffect(() => {
    if (expandedId) {
      const complaint = complaints.find((c) => c._id === expandedId);
      if (complaint && !riskInputs[expandedId]) {
        setRiskInputs((prev) => ({
          ...prev,
          [expandedId]: {
            probability: complaint.probability || "",
            severity: complaint.severity || "",
          },
        }));
      }
    }
  }, [expandedId, complaints, riskInputs]);

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === id ? { ...c, status: newStatus } : c
          )
        );
      }
    } catch {
      console.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateRiskAssessment = async (id) => {
    const input = riskInputs[id];
    if (!input?.probability || !input?.severity) return;

    setUpdatingId(id);
    try {
      const payload = {
        probability: Number(input.probability),
        severity: input.severity,
      };
      console.log("Sending risk assessment payload:", payload);

      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Server response:", data);

      if (res.ok && data.success) {
        const saved = data.complaint;

        // Update the complaint in local state so badge renders immediately
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === id
              ? {
                  ...c,
                  probability: saved.probability,
                  severity: saved.severity,
                  riskLevel: saved.riskLevel,
                }
              : c
          )
        );

        // Update risk inputs to reflect saved values (keep dropdowns showing)
        setRiskInputs((prev) => ({
          ...prev,
          [id]: {
            probability: saved.probability,
            severity: saved.severity,
          },
        }));

        // Row stays expanded so admin sees the confirmation
      } else {
        console.error("Risk assessment update failed:", data.error);
        alert("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to update risk assessment:", err);
      alert("Network error — please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const setRiskField = (id, field, value) => {
    setRiskInputs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    review: complaints.filter((c) => c.status === "Under Review").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Shared risk assessment panel (used in both desktop expanded row and mobile cards)
  const renderRiskAssessmentPanel = (complaint) => {
    const input = riskInputs[complaint._id] || {
      probability: complaint.probability || "",
      severity: complaint.severity || "",
    };
    const previewRisk = getPreviewRisk(input.probability, input.severity);
    const previewConfig = previewRisk ? RISK_PREVIEW_CONFIG[previewRisk] : null;
    const isUpdating = updatingId === complaint._id;
    const hasExisting = complaint.riskLevel != null;

    return (
      <div className="mt-4 pt-4 border-t border-border/50">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>✈</span> ICAO Risk Assessment
          {hasExisting && (
            <span className="text-[10px] font-normal text-muted/70 normal-case tracking-normal">
              (Currently: {complaint.probability}{complaint.severity} — {complaint.riskLevel})
            </span>
          )}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          {/* Probability dropdown */}
          <div>
            <label
              htmlFor={`prob-${complaint._id}`}
              className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
            >
              Probability
            </label>
            <select
              id={`prob-${complaint._id}`}
              value={input.probability}
              onChange={(e) =>
                setRiskField(
                  complaint._id,
                  "probability",
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus-ring cursor-pointer appearance-none"
            >
              <option value="">Select…</option>
              {PROBABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity dropdown */}
          <div>
            <label
              htmlFor={`sev-${complaint._id}`}
              className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
            >
              Severity
            </label>
            <select
              id={`sev-${complaint._id}`}
              value={input.severity}
              onChange={(e) =>
                setRiskField(complaint._id, "severity", e.target.value)
              }
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus-ring cursor-pointer appearance-none"
            >
              <option value="">Select…</option>
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live preview + Save */}
          <div className="flex flex-col gap-2">
            <span className="block text-[10px] text-muted uppercase tracking-wider mb-0 font-medium">
              Risk Level
            </span>
            {previewConfig ? (
              <div
                className={`rounded-lg px-3 py-2 border ${previewConfig.bg} ${previewConfig.border} shadow-lg ${previewConfig.glow} risk-preview-pulse`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{previewConfig.icon}</span>
                  <div>
                    <p className={`text-xs font-bold ${previewConfig.text}`}>
                      {previewConfig.label}
                    </p>
                    <p className="text-[9px] text-muted/80 leading-tight mt-0.5">
                      {previewConfig.sublabel}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg px-3 py-2 border border-border/50 bg-card/50">
                <p className="text-[10px] text-muted/60 italic">
                  Select both probability and severity to preview
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateRiskAssessment(complaint._id);
            }}
            disabled={!previewRisk || isUpdating}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer
              ${
                previewRisk && !isUpdating
                  ? "bg-sky-blue text-white hover:bg-sky-blue/90 shadow-md shadow-sky-blue/20"
                  : "bg-card text-muted/50 cursor-not-allowed border border-border/50"
              }`}
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              "Save Risk Assessment"
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            Admin Control Center
          </h1>
          <p className="text-sm text-muted mt-1">
            Monitor and manage all safety reports across departments
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Reports",
              value: stats.total,
              icon: "📊",
              color: "sky-blue",
              bgClass: "bg-sky-blue/10 border-sky-blue/20",
              textClass: "text-sky-blue",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: "⚠",
              color: "warning-yellow",
              bgClass: "bg-warning-yellow/10 border-warning-yellow/20",
              textClass: "text-warning-yellow",
            },
            {
              label: "Under Review",
              value: stats.review,
              icon: "🔍",
              color: "sky-blue",
              bgClass: "bg-sky-blue/10 border-sky-blue/20",
              textClass: "text-sky-blue",
            },
            {
              label: "Resolved",
              value: stats.resolved,
              icon: "✓",
              color: "emerald-green",
              bgClass: "bg-emerald-green/10 border-emerald-green/20",
              textClass: "text-emerald-green",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`glass rounded-xl p-5 border ${stat.bgClass} animate-slide-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{stat.icon}</span>
                <span className={`text-2xl font-bold ${stat.textClass}`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-muted uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="glass rounded-xl p-4 mb-6 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted uppercase tracking-wider font-medium">
              Filter by:
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilter(cat.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                    filter === cat.value
                      ? "bg-sky-blue text-white shadow-md shadow-sky-blue/20"
                      : "bg-card text-muted hover:text-foreground hover:bg-card-hover"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reports table/list */}
        <div className="glass rounded-2xl overflow-hidden animate-slide-up">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3 opacity-30">📋</div>
              <p className="text-muted text-sm">
                No reports found for the selected filter
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Reporter
                      </th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Title
                      </th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Category
                      </th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Location
                      </th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint, index) => (
                      <Fragment key={complaint._id}>
                        <tr
                          className={`border-b border-border/50 hover:bg-card/50 transition-colors cursor-pointer animate-fade-in`}
                          style={{ animationDelay: `${index * 0.03}s` }}
                          onClick={() =>
                            setExpandedId(
                              expandedId === complaint._id
                                ? null
                                : complaint._id
                            )
                          }
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {complaint.userId?.name || "Unknown"}
                              </p>
                              <p className="text-[10px] text-muted">
                                {complaint.userId?.email || ""}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground max-w-[200px] truncate">
                            {complaint.title}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-muted bg-accent-navy px-2 py-1 rounded-md">
                              {CATEGORIES.find(
                                (c) => c.value === complaint.category
                              )?.label || complaint.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            {complaint.location}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted whitespace-nowrap">
                            {new Date(
                              complaint.createdAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={complaint.status} />
                              <RiskBadge riskLevel={complaint.riskLevel} />
                            </div>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={complaint.status}
                              onChange={(e) =>
                                updateStatus(complaint._id, e.target.value)
                              }
                              disabled={updatingId === complaint._id}
                              className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus-ring cursor-pointer appearance-none disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        {/* Expanded detail row */}
                        {expandedId === complaint._id && (
                          <tr className="bg-card/30">
                            <td colSpan={7} className="px-6 py-4 animate-slide-down">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                                    Description
                                  </h4>
                                  <p className="text-sm text-foreground leading-relaxed">
                                    {complaint.description}
                                  </p>
                                </div>
                                {complaint.imageUrl && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                                      Photo Evidence
                                    </h4>
                                    <a
                                      href={complaint.imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={complaint.imageUrl}
                                        alt="Evidence"
                                        className="w-full max-w-xs h-40 object-cover rounded-lg border border-border hover:border-sky-blue/50 transition-colors"
                                      />
                                    </a>
                                  </div>
                                )}
                              </div>
                              {/* Risk Assessment Panel */}
                              {renderRiskAssessmentPanel(complaint)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden p-4 space-y-3">
                {complaints.map((complaint, index) => (
                  <div
                    key={complaint._id}
                    className={`p-4 bg-card rounded-xl border border-border animate-fade-in`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {complaint.title}
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          by {complaint.userId?.name || "Unknown"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={complaint.status} />
                        <RiskBadge riskLevel={complaint.riskLevel} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] text-muted bg-accent-navy px-2 py-0.5 rounded">
                        {CATEGORIES.find(
                          (c) => c.value === complaint.category
                        )?.label || complaint.category}
                      </span>
                      <span className="text-[10px] text-muted">
                        📍 {complaint.location}
                      </span>
                    </div>

                    <p className="text-xs text-muted line-clamp-2 mb-3">
                      {complaint.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-[10px] text-muted/70">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          value={complaint.status}
                          onChange={(e) =>
                            updateStatus(complaint._id, e.target.value)
                          }
                          disabled={updatingId === complaint._id}
                          className="bg-accent-navy border border-border rounded-lg px-2 py-1 text-[10px] text-foreground cursor-pointer appearance-none disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === complaint._id
                                ? null
                                : complaint._id
                            )
                          }
                          className="text-[10px] text-sky-blue underline underline-offset-2 cursor-pointer"
                        >
                          {expandedId === complaint._id ? "Close" : "Assess Risk"}
                        </button>
                      </div>
                    </div>

                    {complaint.imageUrl && (
                      <a
                        href={complaint.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-3"
                      >
                        <img
                          src={complaint.imageUrl}
                          alt="Evidence"
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                      </a>
                    )}

                    {/* Mobile risk assessment panel */}
                    {expandedId === complaint._id && (
                      <div className="animate-slide-down">
                        {renderRiskAssessmentPanel(complaint)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
