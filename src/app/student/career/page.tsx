"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Sparkles,
  ArrowRight,
  Target,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Bookmark,
} from "lucide-react";

interface ExistingSkill {
  skill: string;
  level: string;
  source: string;
}

interface MissingSkill {
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

interface RoadmapPhase {
  phase: string;
  actions: string[];
  timeframe: string;
}

interface CareerAnalysis {
  existingSkills: ExistingSkill[];
  missingSkills: MissingSkill[];
  roadmap: RoadmapPhase[];
}

export default function StudentCareerPage() {
  const [career, setCareer] = useState("Software Engineer");
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const careerRoles = [
    "Software Engineer",
    "Data Scientist",
    "Mechanical Engineer",
    "Product Manager",
    "Financial Analyst",
    "Database Administrator",
  ];

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/student/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerRole: career }),
      });
      if (!res.ok) throw new Error("Failed to analyze career skill gaps");
      const json = await res.json();
      setAnalysis(json.analysis);
    } catch (err: any) {
      setError(err.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "medium": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default: return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-600/20 to-emerald-500/10 border border-teal-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-teal-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              AI Career Advisor
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
              AI Career Skill Gap Analysis
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Select a future career target to align your current academic status and generate a personalized skill roadmap.
            </p>
          </div>
        </div>

        {/* Career Selector Widget */}
        <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Select Target Career / Role</label>
            <select
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
            >
              {careerRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="sm:self-end px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Analyze Skill Gap</span>
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-teal-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-[#151922] border border-rose-500/20 rounded-3xl p-8 text-center text-rose-400">
            {error}
          </div>
        ) : analysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Existing & Missing Skills */}
            <div className="lg:col-span-1 space-y-6">
              {/* Existing Skills */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-teal-400" />
                  Your Existing Skills
                </h3>
                <div className="space-y-3">
                  {analysis.existingSkills.map((sk, idx) => (
                    <div key={idx} className="p-4 bg-[#0d0f14]/50 border border-gray-800/80 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-semibold text-white">{sk.skill}</h4>
                        <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-bold border border-teal-500/20">
                          {sk.level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-normal">From: {sk.source}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                  Key Skill Gaps
                </h3>
                <div className="space-y-3">
                  {analysis.missingSkills.map((sk, idx) => (
                    <div key={idx} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-semibold text-white">{sk.skill}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${priorityBadge(sk.priority)}`}>
                          {sk.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-normal">{sk.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Development Roadmap */}
            <div className="lg:col-span-2">
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  Personalized Development Roadmap
                </h3>
                <div className="relative border-l border-gray-800 ml-4 pl-6 space-y-8">
                  {analysis.roadmap.map((phase, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 ring-4 ring-[#151922] ring-offset-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-bold text-white">{phase.phase}</h4>
                          <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-bold">
                            {phase.timeframe}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {phase.actions.map((act, ai) => (
                            <li key={ai} className="text-xs text-gray-400 flex items-start gap-1.5">
                              <ArrowRight className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-12 text-center text-gray-500">
            <Lightbulb className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm">Click "Analyze Skill Gap" to build your career profile roadmap.</p>
          </div>
        )}
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
