"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Test credentials helper
  const handleFillCredentials = (role: "student" | "teacher" | "admin") => {
    setError(null);
    if (role === "admin") {
      setEmail("admin@smartedu.com");
      setPassword("admin123");
    } else if (role === "teacher") {
      setEmail("teacher1@smartedu.com");
      setPassword("teacher123");
    } else {
      setEmail("deivasri@smartedu.com");
      setPassword("student123");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Successful login, middleware handles redirect or we redirect manually
      const role = data.user.role.toUpperCase();
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "TEACHER") {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0d0f14] overflow-hidden px-4">
      {/* Background blobs for premium glassmorphism feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/0 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/0 blur-[120px]" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/10 mb-4 animate-pulse">
            <GraduationCap className="h-10 w-10 text-[#0d0f14]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-indigo-400 bg-clip-text text-transparent">
            SmartEdu AI
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Academic Intelligence Platform</p>
        </div>

        <div className="bg-[#151922]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {error && (
            <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6 text-sm text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="name@smartedu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0d0f14]/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0d0f14]/50 border border-gray-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[#0d0f14] font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Seed Credentials helper */}
          <div className="mt-8 border-t border-gray-800 pt-6">
            <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider text-center">
              Quick Sandbox Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillCredentials("student")}
                className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 hover:text-emerald-300 text-xs font-semibold py-2 px-3 rounded-lg transition-all text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials("teacher")}
                className="bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 hover:text-indigo-300 text-xs font-semibold py-2 px-3 rounded-lg transition-all text-center"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials("admin")}
                className="bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 text-purple-400 hover:text-purple-300 text-xs font-semibold py-2 px-3 rounded-lg transition-all text-center"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
