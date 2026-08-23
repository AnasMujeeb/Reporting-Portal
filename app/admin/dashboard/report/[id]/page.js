"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import RiskBadge from "@/components/RiskBadge";

const CATEGORIES = {
  flight_ops: "Flight Operations",
  ground_ops: "Ground Operations",
  maintenance: "Maintenance",
  facilities: "Facilities",
};

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


const RISK_MATRIX = {
  "5A": "Red", "5B": "Red", "5C": "Red", "5D": "Yellow", "5E": "Yellow",
  "4A": "Red", "4B": "Red", "4C": "Yellow", "4D": "Yellow", "4E": "Yellow",
  "3A": "Red", "3B": "Yellow", "3C": "Yellow", "3D": "Yellow", "3E": "Green",
  "2A": "Yellow", "2B": "Yellow", "2C": "Yellow", "2D": "Green", "2E": "Green",
  "1A": "Yellow", "1B": "Green", "1C": "Green", "1D": "Green", "1E": "Green",
};

function getPreviewRisk(probability, severity) {
  if (!probability || !severity) return null;
  const code = `${probability}${severity}`;
  const level = RISK_MATRIX[code];
  if (!level) return null;
  return { matrixCode: code, riskLevel: level };
}

const RISK_LEVEL_CONFIG = {
  Red: {
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    text: "text-red-400",
    glow: "shadow-red-500/20",
    label: "HIGH RISK — Unacceptable",
    sublabel: "Immediate corrective action required",
    icon: "🔴",
    ring: "ring-red-500/30",
  },
  Yellow: {
    bg: "bg-yellow-400/15",
    border: "border-yellow-400/40",
    text: "text-yellow-400",
    glow: "shadow-yellow-400/20",
    label: "MEDIUM RISK — Tolerable",
    sublabel: "Mitigation actions required, review needed",
    icon: "🟡",
    ring: "ring-yellow-400/30",
  },
  Green: {
    bg: "bg-emerald-400/15",
    border: "border-emerald-400/40",
    text: "text-emerald-400",
    glow: "shadow-emerald-400/20",
    label: "LOW RISK — Acceptable",
    sublabel: "Minimal risk, safe to close",
    icon: "🟢",
    ring: "ring-emerald-400/30",
  },
};

export default function ReportDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { data: session, status: authStatus } = useSession() || {};

  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const [initialProbability, setInitialProbability] = useState("");
  const [initialSeverity, setInitialSeverity] = useState("");
  const [initialCorrectiveAction, setInitialCorrectiveAction] = useState("");
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [finalProbability, setFinalProbability] = useState("");
  const [finalSeverity, setFinalSeverity] = useState("");
  const [greenRemarks, setGreenRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const initialRisk = getPreviewRisk(initialProbability, initialSeverity);
  const finalRisk = getPreviewRisk(finalProbability, finalSeverity);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/complaints`);
      const data = await res.json();

      if (res.ok) {
        const found = data.complaints.find((c) => c._id === id);
        if (found) {
          setReport(found);
        } else {
          setError("Report not found");
        }
      } else {
        setError(data.error || "Failed to fetch report");
      }
    } catch {
      setError("Network error — could not load report");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchReport();
    }
  }, [authStatus, fetchReport]);

  
  const resetForm = () => {
    setInitialProbability("");
    setInitialSeverity("");
    setInitialCorrectiveAction("");
    setRootCauseAnalysis("");
    setPreventiveAction("");
    setFinalProbability("");
    setFinalSeverity("");
    setGreenRemarks("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const payload = {
      initialProbability: Number(initialProbability),
      initialSeverity: initialSeverity,
      finalProbability: initialRisk?.riskLevel === "Green"
        ? Number(initialProbability)
        : Number(finalProbability),
      finalSeverity: initialRisk?.riskLevel === "Green"
        ? initialSeverity
        : finalSeverity,
    };

    
    if (initialRisk?.riskLevel !== "Green") {
      payload.initialCorrectiveAction = initialCorrectiveAction;
      payload.rootCauseAnalysis = rootCauseAnalysis;
      payload.preventiveAction = preventiveAction;
    } else {
      
      if (greenRemarks.trim()) {
        payload.remarks = greenRemarks;
      }
    }

    try {
      const res = await fetch(`/api/complaints/${id}/admin-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitSuccess(data.message);
        resetForm();
        
        await fetchReport();
      } else {
        setSubmitError(data.error || "Failed to submit review");
      }
    } catch {
      setSubmitError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  
  const isFormValid = () => {
    if (!initialRisk) return false;
    if (initialRisk.riskLevel === "Green") return true;
    
    return (
      initialCorrectiveAction.trim() &&
      rootCauseAnalysis.trim() &&
      preventiveAction.trim() &&
      finalRisk != null
    );
  };

  
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-sky-blue transition-colors mb-6 group print-hide"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          Back to Dashboard
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-8 text-center animate-fade-in">
            <div className="text-4xl mb-3 opacity-40">⚠</div>
            <p className="text-danger-red text-sm font-medium">{error}</p>
            <Link
              href="/admin/dashboard"
              className="inline-block mt-4 text-sm text-sky-blue hover:underline"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : report ? (
          <div className="space-y-6 animate-fade-in" id="report-content">
            {}
            <div className="print-only-header">
              <div className="print-header-bar">
                <div>
                  <h1 className="print-header-title">Safety Report</h1>
                  <p className="print-header-subtitle">Aviation Safety Reporting Portal — Official Record</p>
                </div>
                <div className="print-header-meta">
                  <p>Report ID: <span className="font-mono">{report._id}</span></p>
                  <p>Generated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
            </div>

            {}
            <div className="glass rounded-2xl p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                    {report.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={report.status} />
                    <RiskBadge riskLevel={report.currentRiskLevel} />
                    {report.riskLevel && (
                      <RiskBadge
                        riskLevel={report.riskLevel}
                        matrixCode={
                          report.probability && report.severity
                            ? `${report.probability}${report.severity}`
                            : undefined
                        }
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted uppercase tracking-wider">
                      Report ID
                    </p>
                    <p className="text-[10px] text-muted/70 font-mono mt-0.5">
                      {report._id}
                    </p>
                  </div>
                  {}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="print-hide inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-blue/15 text-sky-blue border border-sky-blue/30 hover:bg-sky-blue/25 transition-all duration-200 cursor-pointer"
                    title="Download or print this report as PDF"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </button>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DetailCard
                  label="Reporter"
                  value={report.userId?.name || "Unknown"}
                  sub={report.userId?.email}
                  icon="👤"
                />
                <DetailCard
                  label="Category"
                  value={CATEGORIES[report.category] || report.category}
                  icon="📂"
                />
                <DetailCard
                  label="Location"
                  value={report.location}
                  icon="📍"
                />
                <DetailCard
                  label="Date Reported"
                  value={new Date(report.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                  sub={new Date(report.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  icon="📅"
                />
              </div>

              {}
              <div className="mt-6 pt-6 border-t border-border/50">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {report.description}
                </p>
              </div>

              {}
              {report.imageUrl && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Photo Evidence
                  </h3>
                  <a
                    href={report.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={report.imageUrl}
                      alt="Evidence"
                      className="max-w-sm h-48 object-cover rounded-lg border border-border hover:border-sky-blue/50 transition-colors"
                    />
                  </a>
                </div>
              )}

              {}
              {report.probability && report.severity && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    ✈ ICAO Risk Assessment
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <MiniStat
                      label="Probability"
                      value={report.probability}
                    />
                    <MiniStat label="Severity" value={report.severity} />
                    <MiniStat
                      label="Matrix Code"
                      value={`${report.probability}${report.severity}`}
                    />
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                        Matrix Risk
                      </p>
                      <RiskBadge riskLevel={report.riskLevel} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {}
            {report.actionPlanHistory && report.actionPlanHistory.length > 0 && (
              <div className="glass rounded-2xl p-6 lg:p-8 animate-slide-up">
                <h2 className="text-base font-bold text-foreground mb-1">
                  Action Plan History
                </h2>
                <p className="text-xs text-muted mb-6">
                  All past admin reviews for this report ({report.actionPlanHistory.length}{" "}
                  {report.actionPlanHistory.length === 1 ? "entry" : "entries"})
                </p>

                <div className="space-y-4">
                  {report.actionPlanHistory.map((entry, i) => (
                    <HistoryEntry
                      key={entry._id || i}
                      entry={entry}
                      index={i}
                      total={report.actionPlanHistory.length}
                    />
                  ))}
                </div>
              </div>
            )}

            {}
            {report.status !== "Closed" && (
              <div className="glass rounded-2xl p-6 lg:p-8 animate-slide-up print-hide">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-blue to-indigo-500 flex items-center justify-center text-white text-sm">
                    📋
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    Admin Review
                  </h2>
                </div>
                <p className="text-xs text-muted mb-6 ml-11">
                  {report.requiresActionPlan
                    ? "Evaluate the current risk using the ICAO 5×5 matrix and submit an action plan"
                    : "This report has been resolved"}
                </p>

                {}
                {submitSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/30 animate-slide-down">
                    <p className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                      <span>✓</span> {submitSuccess}
                    </p>
                  </div>
                )}
                {submitError && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-slide-down">
                    <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                      <span>⚠</span> {submitError}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmitReview}>
                  {}
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                      Step 1 — Current Risk Level Assessment (ICAO Matrix)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                      {}
                      <div>
                        <label
                          htmlFor="init-prob"
                          className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
                        >
                          Probability
                        </label>
                        <select
                          id="init-prob"
                          value={initialProbability}
                          onChange={(e) => {
                            setInitialProbability(
                              e.target.value ? Number(e.target.value) : ""
                            );
                            setSubmitSuccess(null);
                            setSubmitError(null);
                          }}
                          className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-foreground focus-ring cursor-pointer appearance-none"
                        >
                          <option value="">Select probability…</option>
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
                          htmlFor="init-sev"
                          className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
                        >
                          Severity
                        </label>
                        <select
                          id="init-sev"
                          value={initialSeverity}
                          onChange={(e) => {
                            setInitialSeverity(e.target.value);
                            setSubmitSuccess(null);
                            setSubmitError(null);
                          }}
                          className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-foreground focus-ring cursor-pointer appearance-none"
                        >
                          <option value="">Select severity…</option>
                          {SEVERITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Live preview */}
                      <div className="flex flex-col gap-2">
                        <span className="block text-[10px] text-muted uppercase tracking-wider mb-0 font-medium">
                          Risk Level
                        </span>
                        {initialRisk ? (
                          <RiskPreviewCard risk={initialRisk} />
                        ) : (
                          <div className="rounded-lg px-3 py-2.5 border border-border/50 bg-card/50">
                            <p className="text-[10px] text-muted/60 italic">
                              Select both probability and severity to preview
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {}
                  {initialRisk?.riskLevel === "Green" && (
                    <div className="p-5 rounded-xl bg-emerald-400/5 border border-emerald-400/20 space-y-4 animate-slide-down">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🟢</span>
                        <h3 className="text-sm font-semibold text-emerald-400">
                          Risk Acceptable — Close Report
                        </h3>
                        <span className="matrix-code-badge text-emerald-400 border border-emerald-400/30 ml-1">
                          {initialRisk.matrixCode}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        The risk has been assessed as{" "}
                        <strong className="text-emerald-400">Green ({initialRisk.matrixCode})</strong>
                        {" "}— acceptable. Submitting this review will close the report.
                      </p>
                      <div>
                        <label
                          htmlFor="green-remarks"
                          className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
                        >
                          Remarks / Comments (Optional)
                        </label>
                        <textarea
                          id="green-remarks"
                          value={greenRemarks}
                          onChange={(e) => setGreenRemarks(e.target.value)}
                          rows={3}
                          placeholder="Any closing notes or observations..."
                          className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus-ring resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Closing Report...
                          </>
                        ) : (
                          <>
                            <span>✓</span> Close Report
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {}
                  {initialRisk &&
                    (initialRisk.riskLevel === "Yellow" ||
                      initialRisk.riskLevel === "Red") && (
                      <div
                        className={`p-5 rounded-xl border space-y-5 animate-slide-down ${
                          initialRisk.riskLevel === "Red"
                            ? "bg-red-500/5 border-red-500/20"
                            : "bg-yellow-400/5 border-yellow-400/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {RISK_LEVEL_CONFIG[initialRisk.riskLevel].icon}
                          </span>
                          <h3
                            className={`text-sm font-semibold ${RISK_LEVEL_CONFIG[initialRisk.riskLevel].text}`}
                          >
                            Action Plan Required
                          </h3>
                          <span
                            className={`matrix-code-badge ${RISK_LEVEL_CONFIG[initialRisk.riskLevel].text} border ${RISK_LEVEL_CONFIG[initialRisk.riskLevel].border} ml-1`}
                          >
                            {initialRisk.matrixCode}
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">
                          Risk assessed as{" "}
                          <span
                            className={`font-semibold ${RISK_LEVEL_CONFIG[initialRisk.riskLevel].text}`}
                          >
                            {initialRisk.riskLevel} ({initialRisk.matrixCode})
                          </span>
                          . An action plan with corrective actions, root cause
                          analysis, and preventive actions is required.
                        </p>

                        {}
                        <div>
                          <label
                            htmlFor="corrective-action"
                            className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
                          >
                            Initial Corrective Action{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            id="corrective-action"
                            value={initialCorrectiveAction}
                            onChange={(e) =>
                              setInitialCorrectiveAction(e.target.value)
                            }
                            rows={3}
                            required
                            placeholder="Describe the immediate corrective actions taken or planned..."
                            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus-ring resize-none"
                          />
                        </div>

                        {}
                        <div>
                          <label
                            htmlFor="root-cause"
                            className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
                          >
                            Root Cause Analysis (RCA){" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            id="root-cause"
                            value={rootCauseAnalysis}
                            onChange={(e) =>
                              setRootCauseAnalysis(e.target.value)
                            }
                            rows={3}
                            required
                            placeholder="Identify the root cause(s) of the hazard..."
                            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus-ring resize-none"
                          />
                        </div>

                        {}
                        <div>
                          <label
                            htmlFor="preventive-action"
                            className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
                          >
                            Preventive Action{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            id="preventive-action"
                            value={preventiveAction}
                            onChange={(e) => setPreventiveAction(e.target.value)}
                            rows={3}
                            required
                            placeholder="Describe long-term preventive measures to avoid recurrence..."
                            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus-ring resize-none"
                          />
                        </div>

                        {}
                        <div>
                          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                            Step 2 — Final Risk Level After Action (ICAO Matrix){" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <p className="text-[10px] text-muted/70 mb-3">
                            Re-evaluate the risk level after corrective actions
                            using the ICAO matrix. Green closes the loop,
                            Yellow/Red requires further action plans.
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                            {}
                            <div>
                              <label
                                htmlFor="final-prob"
                                className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
                              >
                                Probability
                              </label>
                              <select
                                id="final-prob"
                                value={finalProbability}
                                onChange={(e) =>
                                  setFinalProbability(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : ""
                                  )
                                }
                                className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-foreground focus-ring cursor-pointer appearance-none"
                              >
                                <option value="">Select probability…</option>
                                {PROBABILITY_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Final Severity */}
                            <div>
                              <label
                                htmlFor="final-sev"
                                className="block text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium"
                              >
                                Severity
                              </label>
                              <select
                                id="final-sev"
                                value={finalSeverity}
                                onChange={(e) =>
                                  setFinalSeverity(e.target.value)
                                }
                                className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-foreground focus-ring cursor-pointer appearance-none"
                              >
                                <option value="">Select severity…</option>
                                {SEVERITY_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Final live preview */}
                            <div className="flex flex-col gap-2">
                              <span className="block text-[10px] text-muted uppercase tracking-wider mb-0 font-medium">
                                Risk Level
                              </span>
                              {finalRisk ? (
                                <RiskPreviewCard risk={finalRisk} />
                              ) : (
                                <div className="rounded-lg px-3 py-2.5 border border-border/50 bg-card/50">
                                  <p className="text-[10px] text-muted/60 italic">
                                    Select both to preview
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {}
                          {finalRisk && (
                            <div
                              className={`mt-3 p-3 rounded-lg text-xs border animate-slide-down ${
                                finalRisk.riskLevel === "Green"
                                  ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                                  : finalRisk.riskLevel === "Yellow"
                                    ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                              }`}
                            >
                              {finalRisk.riskLevel === "Green" ? (
                                <span>
                                  ✓ Risk mitigated to Green ({finalRisk.matrixCode}) — report will be{" "}
                                  <strong>Closed</strong>
                                </span>
                              ) : (
                                <span>
                                  ⟳ Risk remains {finalRisk.riskLevel} ({finalRisk.matrixCode}) —
                                  report stays{" "}
                                  <strong>In Progress</strong>, another action
                                  plan will be required
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {}
                        <button
                          type="submit"
                          disabled={submitting || !isFormValid()}
                          className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                            ${
                              isFormValid() && !submitting
                                ? "bg-sky-blue text-white hover:bg-sky-blue/90 shadow-lg shadow-sky-blue/20"
                                : "bg-card text-muted/50 border border-border/50"
                            }`}
                        >
                          {submitting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Submitting Review...
                            </>
                          ) : (
                            <>
                              <span>📋</span> Submit Action Plan
                            </>
                          )}
                        </button>
                      </div>
                    )}
                </form>
              </div>
            )}

            {}
            {report.status === "Closed" && (
              <div className="glass rounded-2xl p-6 lg:p-8 animate-slide-up print-hide">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-lg">
                    ✓
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-emerald-400">
                      Report Closed
                    </h2>
                    <p className="text-xs text-muted">
                      This report has been reviewed and the risk has been
                      mitigated to an acceptable level.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}


function RiskPreviewCard({ risk }) {
  const cfg = RISK_LEVEL_CONFIG[risk.riskLevel];
  if (!cfg) return null;

  return (
    <div
      className={`rounded-lg px-3 py-2.5 border ${cfg.bg} ${cfg.border} shadow-lg ${cfg.glow} risk-preview-pulse`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${cfg.text} flex items-center gap-1.5`}>
            {cfg.label}
            <span className="matrix-code-badge">{risk.matrixCode}</span>
          </p>
          <p className="text-[9px] text-muted/80 leading-tight mt-0.5">
            {cfg.sublabel}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, sub, icon }) {
  return (
    <div className="p-3 rounded-xl bg-card/40 border border-border/30">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-muted uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function HistoryEntry({ entry, index, total }) {
  const initialCfg = RISK_LEVEL_CONFIG[entry.initialRiskLevel];
  const finalCfg = RISK_LEVEL_CONFIG[entry.finalRiskLevelAfterAction];

  return (
    <div
      className="relative pl-8 pb-4 animate-fade-in"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {}
      {index < total - 1 && (
        <div className="absolute left-[13px] top-7 w-0.5 h-[calc(100%-12px)] bg-border/50" />
      )}
      {}
      <div
        className={`absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] ${
          entry.finalRiskLevelAfterAction === "Green"
            ? "bg-emerald-400/20 border-emerald-400"
            : entry.finalRiskLevelAfterAction === "Yellow"
              ? "bg-yellow-400/20 border-yellow-400"
              : "bg-red-500/20 border-red-500"
        }`}
      >
        {total - index}
      </div>

      <div className="glass-strong rounded-xl p-5 ml-2">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-foreground">
              Review #{total - index}
            </span>
            <span className="text-[10px] text-muted">
              by {entry.adminId?.name || entry.adminId || "Admin"}
            </span>
          </div>
          <span className="text-[10px] text-muted/70">
            {new Date(entry.reviewDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-card/40 border border-border/30">
          {initialCfg && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${initialCfg.bg} ${initialCfg.border} ${initialCfg.text} border flex items-center gap-1.5`}
            >
              {initialCfg.icon} {entry.initialRiskLevel}
              {entry.initialMatrixCode && (
                <span className="matrix-code-badge">{entry.initialMatrixCode}</span>
              )}
            </div>
          )}
          <span className="text-muted text-lg">→</span>
          {finalCfg && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${finalCfg.bg} ${finalCfg.border} ${finalCfg.text} border flex items-center gap-1.5`}
            >
              {finalCfg.icon} {entry.finalRiskLevelAfterAction}
              {entry.finalMatrixCode && (
                <span className="matrix-code-badge">{entry.finalMatrixCode}</span>
              )}
            </div>
          )}
          {entry.finalRiskLevelAfterAction === "Green" && (
            <span className="text-[10px] text-emerald-400 font-medium ml-auto">
              Report Closed
            </span>
          )}
        </div>

        {}
        {entry.initialCorrectiveAction && (
          <HistoryField
            label="Corrective Action"
            value={entry.initialCorrectiveAction}
          />
        )}
        {entry.rootCauseAnalysis && (
          <HistoryField
            label="Root Cause Analysis"
            value={entry.rootCauseAnalysis}
          />
        )}
        {entry.preventiveAction && (
          <HistoryField
            label="Preventive Action"
            value={entry.preventiveAction}
          />
        )}
        {entry.remarks && (
          <HistoryField
            label="Remarks"
            value={entry.remarks}
          />
        )}
      </div>
    </div>
  );
}

function HistoryField({ label, value }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[10px] text-muted uppercase tracking-wider mb-1 font-medium">
        {label}
      </p>
      <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
        {value}
      </p>
    </div>
  );
}
