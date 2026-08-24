"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Award, BookOpen, BrainCircuit, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";

interface Grade {
  id: string;
  subject: string;
  code: string;
  type: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  comments: string;
}

interface SubjectAvg {
  code: string;
  name: string;
  average: number;
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}

interface StudentData {
  student: {
    id: string;
    name: string;
    email: string;
    class: string;
  };
  grades: Grade[];
  subjectAverages: SubjectAvg[];
  recommendations: Recommendation[];
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/student/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="text-center py-12">
          <p className="text-red-400">Error loading student dashboard data.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate cumulative GPA percentage
  const totalAvg = data.subjectAverages.length > 0
    ? Math.round(data.subjectAverages.reduce((acc, s) => acc + s.average, 0) / data.subjectAverages.length)
    : 0;

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600/30 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Student Profile</span>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">Welcome back, {data.student.name}!</h1>
              <p className="text-gray-400 text-sm mt-1">Keep track of your performance and check out AI-driven study routes.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-[#151922]/80 border border-gray-800 rounded-2xl px-5 py-3.5 backdrop-blur-sm min-w-[120px]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Class Group</span>
                <span className="text-lg font-bold text-white mt-1 block">{data.student.class}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Best Action & Personalized Action Plan Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gradient-to-br from-violet-600/10 to-indigo-500/5 border border-violet-500/20 rounded-3xl p-6 relative overflow-hidden">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">
              ⚡ Next Best Action AI
            </span>
            <h4 className="text-md font-bold text-white mb-2">
              {(data as any).nextBestAction?.action || "Review syllabus"}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              {(data as any).nextBestAction?.reason || "Check subject resources to build a solid study plan."}
            </p>
          </div>

          <div className="lg:col-span-2 bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">
              🛡️ Personalized Action Plan (Early Intervention)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {((data as any).personalizedActionPlan || []).map((step: string, idx: number) => (
                <div key={idx} className="p-3 bg-[#0d0f14]/50 border border-gray-800/80 rounded-2xl flex gap-2.5 items-start">
                  <span className="h-4 w-4 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-gray-300 leading-normal">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10 text-emerald-400">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Cumulative average</span>
              <span className="text-3xl font-bold text-white mt-1 block">{totalAvg}%</span>
            </div>
          </div>

          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/10 text-indigo-400">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Graded Subjects</span>
              <span className="text-3xl font-bold text-white mt-1 block">{data.subjectAverages.length}</span>
            </div>
          </div>

          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/10 text-purple-400">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Assessments</span>
              <span className="text-3xl font-bold text-white mt-1 block">{data.grades.length}</span>
            </div>
          </div>
        </div>

        {/* Academic Analytics & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart block */}
          <div className="lg:col-span-2 bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <span>Subject Performance</span>
              </h3>
            </div>
            
            <div className="h-80 w-full">
              {data.subjectAverages.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.subjectAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} />
                    <YAxis stroke="#666" fontSize={11} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#151922", borderColor: "#333", borderRadius: "12px", color: "#fff" }}
                    />
                    <Bar dataKey="average" fill="url(#colorAvg)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  No subject grade data available yet.
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex flex-col">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 shrink-0">
              <BrainCircuit className="h-5 w-5 text-purple-400" />
              <span>Academic Copilot AI</span>
            </h3>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
              {data.recommendations.length > 0 ? (
                data.recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 bg-[#0d0f14]/50 border border-gray-800 rounded-2xl hover:border-gray-700 transition-colors">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                      {rec.type.replace("_", " ")}
                    </span>
                    <h4 className="text-sm font-bold text-white mb-2">{rec.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{rec.content}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <BrainCircuit className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-xs">No AI insights generated yet. AI analyzes grade histories to provide tips.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-800/80">
            <h3 className="text-lg font-bold text-white">Recent Assessments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d0f14]/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Teacher Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {data.grades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{grade.subject}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium rounded-full">
                        {grade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-400">{grade.score}</span>
                      <span className="text-gray-500"> / {grade.maxScore}</span>
                      <span className="text-xs text-gray-500 block">({grade.percentage}%)</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{grade.date}</td>
                    <td className="px-6 py-4 text-xs italic text-gray-400 max-w-xs truncate">
                      {grade.comments || "No comment"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
