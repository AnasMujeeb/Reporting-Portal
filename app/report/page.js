"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

const CATEGORIES = [
  { value: "flight_ops", label: "Flight Operations" },
  { value: "ground_ops", label: "Ground Operations" },
  { value: "maintenance", label: "Maintenance" },
  { value: "facilities", label: "Facilities" },
];

export default function ReportPage() {
  const { data: session, status } = useSession();
  const [complaints, setComplaints] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    description: "",
    imageUrl: "",
  });

  const fetchComplaints = useCallback(async () => {
    try {
      const res = await fetch("/api/complaints");
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints);
      }
    } catch {
      console.error("Failed to fetch complaints");
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchComplaints();
    }
  }, [status, fetchComplaints]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message || "Failed to upload image");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setSuccess("Hazard report submitted successfully!");
      setFormData({
        title: "",
        category: "",
        location: "",
        description: "",
        imageUrl: "",
      });
      setImagePreview(null);
      fetchComplaints();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            Hazard Reporting
          </h1>
          <p className="text-sm text-muted mt-1">
            Submit safety concerns and track your reports
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Report Form */}
          <div className="lg:col-span-2 animate-slide-up">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-sky-blue/20 flex items-center justify-center text-sky-blue text-sm">
                  📋
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  New Report
                </h2>
              </div>

              {/* Success message */}
              {success && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-green-bg border border-emerald-green/30 text-emerald-green text-sm animate-slide-down">
                  ✓ {success}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-red-bg border border-danger-red/30 text-danger-red text-sm animate-slide-down">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label
                    htmlFor="report-title"
                    className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                  >
                    Report Title *
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Brief title of the hazard"
                    required
                    className="w-full px-4 py-3 bg-accent-navy border border-border rounded-xl text-foreground placeholder-muted/50 text-sm focus-ring"
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="report-category"
                    className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                  >
                    Category *
                  </label>
                  <select
                    id="report-category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 bg-accent-navy border border-border rounded-xl text-foreground text-sm focus-ring cursor-pointer appearance-none"
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="report-location"
                    className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                  >
                    Location *
                  </label>
                  <input
                    id="report-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g. Hangar B, Runway 09L, Terminal 2"
                    required
                    className="w-full px-4 py-3 bg-accent-navy border border-border rounded-xl text-foreground placeholder-muted/50 text-sm focus-ring"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="report-description"
                    className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                  >
                    Description *
                  </label>
                  <textarea
                    id="report-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the hazard in detail..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-accent-navy border border-border rounded-xl text-foreground placeholder-muted/50 text-sm focus-ring resize-none"
                  />
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Photo Evidence
                  </label>
                  <div className="relative">
                    <input
                      id="report-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="report-image"
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-border hover:border-sky-blue/50 rounded-xl cursor-pointer transition-colors text-sm text-muted hover:text-foreground"
                    >
                      {uploading ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        <>
                          📸 <span>Upload photo (optional)</span>
                        </>
                      )}
                    </label>
                  </div>

                  {imagePreview && (
                    <div className="mt-3 relative group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, imageUrl: "" });
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-danger-red rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full py-3 bg-gradient-to-r from-sky-blue to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-sky-blue/20 hover:shadow-sky-blue/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {submitting ? "Submitting Report..." : "Submit Hazard Report"}
                </button>
              </form>
            </div>
          </div>

          {/* Reports History */}
          <div className="lg:col-span-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-green/20 flex items-center justify-center text-emerald-green text-sm">
                    📊
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    My Reports
                  </h2>
                </div>
                <span className="text-xs text-muted bg-card px-3 py-1 rounded-full">
                  {complaints.length} total
                </span>
              </div>

              {loadingReports ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 opacity-30">📋</div>
                  <p className="text-muted text-sm">
                    No reports submitted yet
                  </p>
                  <p className="text-muted/50 text-xs mt-1">
                    Use the form to submit your first hazard report
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((complaint, index) => (
                    <div
                      key={complaint._id}
                      className={`p-4 bg-card hover:bg-card-hover rounded-xl border border-border transition-all duration-200 animate-fade-in stagger-${Math.min(index + 1, 6)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {complaint.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted bg-accent-navy px-2 py-0.5 rounded-md">
                              {CATEGORIES.find(
                                (c) => c.value === complaint.category
                              )?.label || complaint.category}
                            </span>
                            <span className="text-xs text-muted">
                              📍 {complaint.location}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={complaint.status} />
                      </div>
                      <p className="text-xs text-muted mt-2 line-clamp-2">
                        {complaint.description}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <span className="text-[10px] text-muted/70">
                          {new Date(complaint.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {complaint.imageUrl && (
                          <a
                            href={complaint.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sky-blue hover:underline"
                          >
                            View Photo →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
