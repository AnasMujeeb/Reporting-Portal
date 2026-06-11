"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        // Signup flow
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Signup failed");
        }

        // Auto-login after signup
        const loginResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (loginResult?.error) {
          throw new Error(loginResult.error);
        }

        router.push("/report");
      } else {
        // Login flow
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        // Fetch session to check role
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        if (session?.user?.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/report");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError("");
    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 aviation-grid relative overflow-hidden">
      {/* Ambient light effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-sky-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-blue to-indigo-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-sky-blue/25 animate-glow-pulse">
            ✈
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Star Aviation <span className="text-sky-blue">Pvt Ltd</span>
          </h1>
          <p className="text-sm text-muted mt-1 tracking-wide">
            Safety Management Portal
          </p>
        </div>

        {/* Login / Signup card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
          {/* Tab header */}
          <div className="flex mb-6 bg-accent-navy rounded-xl p-1">
            <button
              onClick={() => !loading && toggleMode()}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                !isSignup
                  ? "bg-card text-foreground shadow-md"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => !loading && toggleMode()}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                isSignup
                  ? "bg-card text-foreground shadow-md"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger-red-bg border border-danger-red/30 text-danger-red text-sm animate-slide-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (signup only) */}
            {isSignup && (
              <div className="animate-slide-down">
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-3 bg-accent-navy border border-border rounded-xl text-foreground placeholder-muted/50 text-sm focus-ring transition-all duration-200"
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@staraviation.com"
                required
                className="w-full px-4 py-3 bg-accent-navy border border-border rounded-xl text-foreground placeholder-muted/50 text-sm focus-ring transition-all duration-200"
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-muted uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isSignup ? "Min. 6 characters" : "••••••••"}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-accent-navy border border-border rounded-xl text-foreground placeholder-muted/50 text-sm focus-ring transition-all duration-200"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-sky-blue to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-sky-blue/20 hover:shadow-sky-blue/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
                  {isSignup ? "Creating Account..." : "Authenticating..."}
                </span>
              ) : isSignup ? (
                "Create Account"
              ) : (
                "Login to Portal"
              )}
            </button>
          </form>

          {/* Toggle prompt */}
          <p className="mt-6 text-center text-sm text-muted">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => !loading && toggleMode()}
              className="text-sky-blue hover:underline font-medium cursor-pointer"
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted/50 mt-6">
          © {new Date().getFullYear()} Star Aviation Pvt Ltd — Safety Management
          System
        </p>
      </div>
    </div>
  );
}
