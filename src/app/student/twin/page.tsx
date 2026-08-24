"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Brain,
  Sparkles,
  TrendingUp,
  User,
  RefreshCw,
  Award,
  Zap,
  CheckCircle,
} from "lucide-react";

interface SubjectMastery {
  subject: string;
  score: number;
}

interface LearningPattern {
  pattern: string;
  details: string;
}

interface TwinData {
  academicPersona: string;
  biography: string;
  subjectMastery: SubjectMastery[];
  learningPatterns: LearningPattern[];
  personalizedInsights: string[];
}

export default function StudentTwinPage() {
  const [twin, setTwin] = useState<TwinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTwin = async () => {
    setLoading(true);
    setError(null);
    try {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const res = await fetch(`/api/student/twin${search}`);
      if (!res.ok) throw new Error("Failed to load student digital twin");
      const json = await res.json();
      setTwin(json.twin);
    } catch (err: any) {
      setError(err.message || "Failed to load Digital Twin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, []);

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600/20 to-indigo-500/10 border border-violet-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-violet-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                AI Digital Twin
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                Student Digital Twin
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                A visual mapping of your academic persona, learning patterns, and subject mastery.
              </p>
            </div>
            <button
              onClick={fetchTwin}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl text-violet-400 text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Twin</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-[#151922] border border-rose-500/20 rounded-3xl p-8 text-center text-rose-400">
            {error}
          </div>
        ) : twin ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Academic Persona & Bio */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-[#1b1c24] to-[#15161c] border border-gray-800/80 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Academic Identity</span>
                    <h2 className="text-lg font-bold text-white leading-tight">{twin.academicPersona}</h2>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed bg-[#0d0f14]/50 border border-gray-800/60 rounded-2xl p-4">
                  {twin.biography}
                </p>
              </div>

              {/* Learning Patterns */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  Learning Patterns
                </h3>
                <div className="space-y-4">
                  {twin.learningPatterns.map((lp, idx) => (
                    <div key={idx} className="bg-[#0d0f14]/50 border border-gray-800/80 rounded-2xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-violet-400" />
                        {lp.pattern}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{lp.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Subject Mastery & Insights */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subject Mastery Progress Bars */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-violet-400" />
                  Subject Mastery Index
                </h3>
                <div className="space-y-4">
                  {twin.subjectMastery.map((sm, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-gray-300">{sm.subject}</span>
                        <span className="font-bold text-violet-400">{sm.score}%</span>
                      </div>
                      <div className="w-full bg-[#0d0f14] rounded-full h-3 border border-gray-800/80 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${sm.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Twin Insights */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  AI Twin Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {twin.personalizedInsights.map((insight, idx) => (
                    <div key={idx} className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl flex gap-3 items-start">
                      <CheckCircle className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-300 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

// Simple loader helper
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
