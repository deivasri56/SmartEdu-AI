"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Sparkles,
  ArrowRight,
  Target,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Bookmark,
  TrendingUp,
  Briefcase,
  Code,
  Users,
  Wrench,
  Award,
  ChevronRight,
  BarChart3,
  Zap,
  CheckCircle,
  Clock,
  Star,
  Search,
  GraduationCap,
  DollarSign,
  Loader2,
} from "lucide-react";

/* ───────────── Types ───────────── */
interface CareerOverview {
  title: string;
  description: string;
  averageSalary: string;
  demandLevel: "high" | "medium" | "low";
  industryGrowth: string;
}

interface TechnicalSkill {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  description: string;
}

interface SoftSkill {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  description: string;
}

interface ToolItem {
  name: string;
  category: string;
  description: string;
}

interface CertificationItem {
  name: string;
  provider: string;
  level: string;
  relevance: string;
}

interface RequiredSkills {
  technical: TechnicalSkill[];
  soft: SoftSkill[];
  tools: ToolItem[];
  certifications: CertificationItem[];
}

interface ExistingSkill {
  skill: string;
  level: string;
  source: string;
  matchStrength: "strong" | "moderate" | "weak";
}

interface SkillGap {
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
  howToLearn: string;
}

interface RoadmapPhase {
  phase: string;
  timeframe: string;
  actions: string[];
  milestones: string[];
  resources: string[];
}

interface CareerAnalysis {
  careerOverview: CareerOverview;
  requiredSkills: RequiredSkills;
  existingSkills: ExistingSkill[];
  skillGaps: SkillGap[];
  roadmap: RoadmapPhase[];
  readinessScore: number;
  keyInsight: string;
}

/* ───────────── Career Roles ───────────── */
const CAREER_CATEGORIES = [
  {
    category: "Technology",
    roles: [
      "Software Engineer",
      "Data Scientist",
      "AI/ML Engineer",
      "Full Stack Developer",
      "Cloud Architect",
      "Cybersecurity Analyst",
      "DevOps Engineer",
      "Mobile App Developer",
      "Blockchain Developer",
      "UI/UX Designer",
    ],
  },
  {
    category: "Engineering",
    roles: [
      "Mechanical Engineer",
      "Civil Engineer",
      "Electrical Engineer",
      "Biomedical Engineer",
      "Aerospace Engineer",
      "Chemical Engineer",
    ],
  },
  {
    category: "Business & Finance",
    roles: [
      "Product Manager",
      "Financial Analyst",
      "Management Consultant",
      "Investment Banker",
      "Entrepreneur",
      "Business Analyst",
    ],
  },
  {
    category: "Science & Research",
    roles: [
      "Research Scientist",
      "Biotechnologist",
      "Environmental Scientist",
      "Pharmacist",
      "Astrophysicist",
    ],
  },
  {
    category: "Healthcare",
    roles: [
      "Doctor (MBBS)",
      "Nurse Practitioner",
      "Public Health Specialist",
      "Clinical Psychologist",
    ],
  },
  {
    category: "Creative & Media",
    roles: [
      "Graphic Designer",
      "Content Strategist",
      "Game Developer",
      "Video Producer",
    ],
  },
];

/* ───────────── Component ───────────── */
export default function StudentCareerPage() {
  const [career, setCareer] = useState("Software Engineer");
  const [customCareer, setCustomCareer] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSkillTab, setActiveSkillTab] = useState<"technical" | "soft" | "tools" | "certifications">("technical");
  // Fetch logged in user email to scope localStorage keys
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.user.email);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUser();
  }, []);

  // Load from localStorage once user email is fetched
  useEffect(() => {
    if (!userEmail) return;
    const storedCareer = localStorage.getItem(`career_${userEmail}`);
    const storedUseCustom = localStorage.getItem(`useCustom_${userEmail}`);
    const storedCustomCareer = localStorage.getItem(`customCareer_${userEmail}`);
    const storedAnalysis = localStorage.getItem(`analysis_${userEmail}`);

    if (storedCareer) setCareer(storedCareer);
    if (storedUseCustom) setUseCustom(storedUseCustom === "true");
    if (storedCustomCareer) setCustomCareer(storedCustomCareer);
    if (storedAnalysis) {
      try {
        setAnalysis(JSON.parse(storedAnalysis));
      } catch (e) {
        console.error("Failed to parse stored analysis", e);
      }
    }
  }, [userEmail]);

  const handleAnalyze = async () => {
    const selectedRole = useCustom ? customCareer.trim() : career;
    if (!selectedRole) {
      setError("Please select or enter a career role.");
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/student/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerRole: selectedRole }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to analyze career skill gaps");
      }
      const json = await res.json();
      setAnalysis(json.analysis);

      // Save to localStorage scoped by user email
      if (userEmail) {
        localStorage.setItem(`career_${userEmail}`, career);
        localStorage.setItem(`useCustom_${userEmail}`, useCustom ? "true" : "false");
        localStorage.setItem(`customCareer_${userEmail}`, customCareer);
        localStorage.setItem(`analysis_${userEmail}`, JSON.stringify(json.analysis));
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  /* ───── Utility Renderers ───── */
  const importanceBadge = (importance: string) => {
    switch (importance) {
      case "critical": return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "important": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default: return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "medium": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default: return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  const matchBadge = (strength: string) => {
    switch (strength) {
      case "strong": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "moderate": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default: return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }
  };

  const demandColor = (level: string) => {
    switch (level) {
      case "high": return "text-emerald-400";
      case "medium": return "text-amber-400";
      default: return "text-gray-400";
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const scoreRingColor = (score: number) => {
    if (score >= 70) return "stroke-emerald-500";
    if (score >= 40) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  /* ───── Render ───── */
  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* ═══ Header ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-600/20 via-emerald-500/10 to-cyan-500/10 border border-teal-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-teal-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              AI-Powered Career Advisor
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
              Career Roadmap & Skill Analysis
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">
              Select your dream career — our AI will analyze your academic profile, identify required skills, map your existing strengths, and generate a personalized development roadmap.
            </p>
          </div>
        </div>

        {/* ═══ Career Selector ═══ */}
        <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-teal-400" />
            <h3 className="text-md font-bold text-white">Select Target Career</h3>
          </div>

          {/* Toggle between preset and custom */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setUseCustom(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                !useCustom
                  ? "bg-teal-500/15 text-teal-400 border-teal-500/30"
                  : "bg-transparent text-gray-500 border-gray-800 hover:text-gray-300"
              }`}
            >
              Browse Careers
            </button>
            <button
              onClick={() => setUseCustom(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                useCustom
                  ? "bg-teal-500/15 text-teal-400 border-teal-500/30"
                  : "bg-transparent text-gray-500 border-gray-800 hover:text-gray-300"
              }`}
            >
              <span className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5" /> Custom Role</span>
            </button>
          </div>

          {useCustom ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={customCareer}
                  onChange={(e) => setCustomCareer(e.target.value)}
                  placeholder="Type your dream career role (e.g., Robotics Engineer, Game Designer...)"
                  className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50 transition-colors"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading || !customCareer.trim()}
                className="sm:self-end px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Analyze Career</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {CAREER_CATEGORIES.map((cat) => (
                  <div key={cat.category}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">{cat.category}</p>
                    <div className="space-y-1">
                      {cat.roles.map((role) => (
                        <button
                          key={role}
                          onClick={() => setCareer(role)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            career === role
                              ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
                              : "text-gray-400 hover:text-white hover:bg-gray-800/40 border border-transparent"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-800/60">
                <span className="text-xs text-gray-500">Selected:</span>
                <span className="text-sm font-bold text-teal-400">{career}</span>
                <div className="flex-1" />
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>Analyze Career</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* ═══ Results ═══ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#151922] border border-gray-800/80 rounded-3xl">
            <Loader2 className="h-10 w-10 text-teal-400 animate-spin mb-4" />
            <p className="text-gray-400 font-semibold mb-1">Analyzing Career Path...</p>
            <p className="text-gray-600 text-xs">AI is mapping skills, gaps, and building your personalized roadmap</p>
          </div>
        ) : error ? (
          <div className="bg-[#151922] border border-rose-500/20 rounded-3xl p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
            <p className="text-rose-400 font-semibold">{error}</p>
            <button
              onClick={handleAnalyze}
              className="mt-4 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold transition-all"
            >
              Retry
            </button>
          </div>
        ) : analysis ? (
          <div className="space-y-8">
            {/* ─── Career Overview + Readiness Score ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Career Overview Card */}
              <div className="lg:col-span-3 bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shrink-0">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white mb-1">{analysis.careerOverview.title}</h2>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{analysis.careerOverview.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0f14]/50 border border-gray-800/80 rounded-xl">
                        <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Salary Range</p>
                          <p className="text-xs text-white font-semibold">{analysis.careerOverview.averageSalary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0f14]/50 border border-gray-800/80 rounded-xl">
                        <TrendingUp className={`h-4 w-4 shrink-0 ${demandColor(analysis.careerOverview.demandLevel)}`} />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Demand</p>
                          <p className={`text-xs font-semibold capitalize ${demandColor(analysis.careerOverview.demandLevel)}`}>
                            {analysis.careerOverview.demandLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0f14]/50 border border-gray-800/80 rounded-xl">
                        <BarChart3 className="h-4 w-4 text-sky-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Growth</p>
                          <p className="text-xs text-white font-semibold">{analysis.careerOverview.industryGrowth}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Readiness Score */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Career Readiness</p>
                <div className="relative w-28 h-28 mb-3">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      className={scoreRingColor(analysis.readinessScore)}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(analysis.readinessScore / 100) * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${scoreColor(analysis.readinessScore)}`}>
                      {analysis.readinessScore}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{analysis.keyInsight}</p>
              </div>
            </div>

            {/* ─── Required Skills (Tabbed) ─── */}
            <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Skills Required for {analysis.careerOverview.title}</h3>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {([
                  { id: "technical", label: "Technical Skills", icon: Code, count: analysis.requiredSkills.technical?.length || 0 },
                  { id: "soft", label: "Soft Skills", icon: Users, count: analysis.requiredSkills.soft?.length || 0 },
                  { id: "tools", label: "Tools & Platforms", icon: Wrench, count: analysis.requiredSkills.tools?.length || 0 },
                  { id: "certifications", label: "Certifications", icon: Award, count: analysis.requiredSkills.certifications?.length || 0 },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSkillTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                      activeSkillTab === tab.id
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "text-gray-500 border-gray-800 hover:text-gray-300 hover:border-gray-700"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-gray-800/80">{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSkillTab === "technical" && analysis.requiredSkills.technical?.map((sk, idx) => (
                  <div key={idx} className="p-4 bg-[#0d0f14]/50 border border-gray-800/80 rounded-2xl hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">{sk.skill}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${importanceBadge(sk.importance)}`}>
                        {sk.importance}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{sk.description}</p>
                  </div>
                ))}
                {activeSkillTab === "soft" && analysis.requiredSkills.soft?.map((sk, idx) => (
                  <div key={idx} className="p-4 bg-[#0d0f14]/50 border border-gray-800/80 rounded-2xl hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">{sk.skill}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${importanceBadge(sk.importance)}`}>
                        {sk.importance}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{sk.description}</p>
                  </div>
                ))}
                {activeSkillTab === "tools" && analysis.requiredSkills.tools?.map((tool, idx) => (
                  <div key={idx} className="p-4 bg-[#0d0f14]/50 border border-gray-800/80 rounded-2xl hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">{tool.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold border bg-sky-500/15 text-sky-400 border-sky-500/30">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{tool.description}</p>
                  </div>
                ))}
                {activeSkillTab === "certifications" && analysis.requiredSkills.certifications?.map((cert, idx) => (
                  <div key={idx} className="p-4 bg-[#0d0f14]/50 border border-gray-800/80 rounded-2xl hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">{cert.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold border bg-purple-500/15 text-purple-400 border-purple-500/30">
                        {cert.level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1"><span className="text-gray-400 font-semibold">Provider:</span> {cert.provider}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{cert.relevance}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Existing Skills + Skill Gaps ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Existing Skills */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Your Existing Skills</h3>
                </div>
                <div className="space-y-3">
                  {analysis.existingSkills?.map((sk, idx) => (
                    <div key={idx} className="p-4 bg-[#0d0f14]/50 border border-gray-800/80 rounded-2xl">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white">{sk.skill}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-bold border border-teal-500/20">
                            {sk.level}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${matchBadge(sk.matchStrength)}`}>
                            {sk.matchStrength}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-normal">{sk.source}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                  <h3 className="text-lg font-bold text-white">Key Skill Gaps</h3>
                </div>
                <div className="space-y-3">
                  {analysis.skillGaps?.map((gap, idx) => (
                    <div key={idx} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white">{gap.skill}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${priorityBadge(gap.priority)}`}>
                          {gap.priority} priority
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-normal mb-2">{gap.reason}</p>
                      <div className="flex items-start gap-1.5 px-3 py-2 bg-[#0d0f14]/70 rounded-lg border border-gray-800/50">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-300/80">{gap.howToLearn}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Development Roadmap ─── */}
            <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Personalized Development Roadmap</h3>
              </div>
              <div className="relative border-l-2 border-gray-800 ml-4 pl-8 space-y-10">
                {analysis.roadmap?.map((phase, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline Dot */}
                    <span className="absolute -left-[37px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 ring-4 ring-[#151922] text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h4 className="text-md font-bold text-white">{phase.phase}</h4>
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {phase.timeframe}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mb-3">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Actions</p>
                        <ul className="space-y-1.5">
                          {phase.actions.map((act, ai) => (
                            <li key={ai} className="text-xs text-gray-400 flex items-start gap-2">
                              <ArrowRight className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Milestones */}
                      {phase.milestones && phase.milestones.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Milestones</p>
                          <div className="flex flex-wrap gap-2">
                            {phase.milestones.map((ms, mi) => (
                              <span key={mi} className="text-[11px] px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-medium flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {ms}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      {phase.resources && phase.resources.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Resources</p>
                          <div className="flex flex-wrap gap-2">
                            {phase.resources.map((res, ri) => (
                              <span key={ri} className="text-[11px] px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg font-medium flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Empty State ─── */
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-teal-500/10 rounded-2xl flex items-center justify-center">
              <Lightbulb className="h-8 w-8 text-teal-500/50" />
            </div>
            <p className="text-gray-400 font-semibold mb-1">Select a Career to Begin</p>
            <p className="text-gray-600 text-sm">Choose from the career options above and click &quot;Analyze Career&quot; to get your personalized skill analysis and roadmap.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
