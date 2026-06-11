"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession() || {};
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (!session) return null;

  return (
    <nav className="glass-strong sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-blue to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-blue/20">
              ✈
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-foreground tracking-wide">
                Star Aviation
              </h1>
              <p className="text-[10px] text-muted uppercase tracking-[0.2em]">
                Safety Management
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {session.user.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className="text-sm text-muted hover:text-foreground transition-colors duration-200"
              >
                Dashboard
              </Link>
            )}
            {session.user.role === "employee" && (
              <Link
                href="/report"
                className="text-sm text-muted hover:text-foreground transition-colors duration-200"
              >
                Reports
              </Link>
            )}

            <div className="h-6 w-px bg-border" />

            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {session.user.name}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted">
                  {session.user.role}
                </p>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  session.user.role === "admin"
                    ? "bg-warning-yellow/20 text-warning-yellow"
                    : "bg-sky-blue/20 text-sky-blue"
                }`}
              >
                {session.user.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-danger-red border border-border hover:border-danger-red/50 rounded-lg transition-all duration-200 cursor-pointer"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border animate-slide-down">
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  session.user.role === "admin"
                    ? "bg-warning-yellow/20 text-warning-yellow"
                    : "bg-sky-blue/20 text-sky-blue"
                }`}
              >
                {session.user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {session.user.name}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted">
                  {session.user.role}
                </p>
              </div>
            </div>

            {session.user.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className="block px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-card rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {session.user.role === "employee" && (
              <Link
                href="/report"
                className="block px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-card rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Reports
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-danger-red hover:bg-danger-red-bg rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
