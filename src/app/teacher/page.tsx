"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Award, BookOpen, AlertCircle, PlusCircle, CheckCircle, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";

interface Assignment {
  id: string;
  className: string;
  classId: string;
  subjectName: string;
  subjectCode: string;
  subjectId: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  class: string;
  gpa: number;
  totalGradesRecorded: number;
}

interface ClassPerformance {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  average: number;
  submissionsCount: number;
}

interface TeacherData {
  teacher: {
    id: string;
    name: string;
  };
  assignments: Assignment[];
  students: Student[];
  classPerformance: ClassPerformance[];
}

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/teacher/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="text-center py-12">
          <p className="text-red-400">Error loading teacher dashboard data.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600/30 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Teacher Profile</span>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">Hello, {data.teacher.name}!</h1>
            <p className="text-gray-400 text-sm mt-1">Manage class grades, view performance indicators, and input new assessments.</p>
          </div>
        </div>

        {/* Next Best Action & Early Intervention Alert Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600/10 to-purple-500/5 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
              ⚡ Next Best Action AI
            </span>
            <h4 className="text-md font-bold text-white mb-2">
              {(data as any).nextBestAction?.action || "Review class assignments"}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              {(data as any).nextBestAction?.reason || "Start by analyzing the average performance of each subject class."}
            </p>
          </div>

          <div className="lg:col-span-2 bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-2">
              ⚠️ Students Flagged for support (Early Intervention)
            </span>
            <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1">
              {((data as any).earlyInterventions || []).length > 0 ? (
                ((data as any).earlyInterventions || []).map((ev: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-white">{ev.studentName}</span>
                      <span className="text-gray-500 ml-2">({ev.className}) — GPA: {ev.gpa}%</span>
                    </div>
                    <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold border border-rose-500/20 uppercase">
                      {ev.riskLevel} Risk
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-4 text-center">No students currently flagged for academic risk.</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/10 text-indigo-400">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Assigned Classes</span>
              <span className="text-3xl font-bold text-white mt-1 block">{data.assignments.length}</span>
            </div>
          </div>

          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/10 text-purple-400">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Assigned Students</span>
              <span className="text-3xl font-bold text-white mt-1 block">{data.students.length}</span>
            </div>
          </div>

          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10 text-emerald-400">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Overall average GPA</span>
              <span className="text-3xl font-bold text-white mt-1 block">
                {data.students.length > 0
                  ? Math.round(data.students.reduce((acc, s) => acc + s.gpa, 0) / data.students.length)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 gap-8">
          {/* Class Performances Recharts */}
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-6">Subject Averages per Class</h3>
              <div className="h-64 w-full">
                {data.classPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.classPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="className" stroke="#666" fontSize={11} />
                      <YAxis stroke="#666" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#151922", borderColor: "#333", borderRadius: "12px", color: "#fff" }}
                      />
                      <Bar dataKey="average" fill="url(#colorAvgT)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      <defs>
                        <linearGradient id="colorAvgT" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No class grades recorded yet.
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-[#0d0f14]/50 border border-gray-800 rounded-2xl flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <p className="text-xs text-gray-400">
                Averages calculate total percentage score (score/maxScore) for each student in the respective subject and class group.
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Students List */}
        <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-800/80">
            <h3 className="text-lg font-bold text-white">Assigned Student Roster</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d0f14]/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Class Group</th>
                  <th className="px-6 py-4">Subject GPA</th>
                  <th className="px-6 py-4">Grades Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {data.students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{s.name}</td>
                    <td className="px-6 py-4 text-gray-400">{s.email}</td>
                    <td className="px-6 py-4">{s.class}</td>
                    <td className="px-6 py-4 font-semibold">
                      <span className={s.gpa >= 85 ? "text-emerald-400" : s.gpa >= 70 ? "text-indigo-400" : "text-amber-400"}>
                        {s.gpa}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">{s.totalGradesRecorded}</td>
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
