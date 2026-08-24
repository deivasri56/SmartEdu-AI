"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Award, BookOpen, Layers, ShieldCheck, UserPlus } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  studentCount: number;
  createdAt: string;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  assignments: {
    class: string;
    subject: string;
  }[];
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  class: string;
  gpa: number;
}

interface AdminData {
  stats: {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
  };
  classes: ClassItem[];
  subjects: SubjectItem[];
  teachers: TeacherItem[];
  students: StudentItem[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/dashboard");
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
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="text-center py-12">
          <p className="text-red-400">Error loading admin dashboard data.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/30 to-indigo-500/10 border border-purple-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">System Administration</span>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">Admin Overview Panel</h1>
            <p className="text-gray-400 text-sm mt-1">Manage institutional assets: configure class groups, register subjects, and audit user rosters.</p>
          </div>
        </div>

        {/* Next Best Action AI Card */}
        <div className="bg-gradient-to-br from-purple-600/10 to-indigo-500/5 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
            ⚡ Next Best Action AI
          </span>
          <h4 className="text-md font-bold text-white mb-2">
            {(data as any).nextBestAction?.action || "Review college statistics"}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {(data as any).nextBestAction?.reason || "Verify system parameters to ensure all classes are fully configured."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/10 text-purple-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Students</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{data.stats.students}</span>
            </div>
          </div>

          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/10 text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Teachers</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{data.stats.teachers}</span>
            </div>
          </div>

          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/10 text-emerald-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Classes</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{data.stats.classes}</span>
            </div>
          </div>

          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/10 text-amber-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Subjects</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{data.stats.subjects}</span>
            </div>
          </div>
        </div>

        {/* Classes & Subjects Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Class List */}
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-4">Class Divisions</h3>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d0f14]/30 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800/80">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Students Enrolled</th>
                    <th className="py-3 px-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
                  {data.classes.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-gray-800 text-emerald-400 text-xs font-semibold border border-gray-700 rounded-md">
                          {c.studentCount} students
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{c.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subject List */}
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-4">Academic Subjects</h3>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d0f14]/30 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800/80">
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Subject Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
                  {data.subjects.map((sub) => (
                    <tr key={sub.id}>
                      <td className="py-3 px-4 font-bold text-white">{sub.name}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-500/5 px-2.5 py-1 border border-indigo-500/10 rounded-lg">
                          {sub.code}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Teacher Roster */}
        <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-800/80">
            <h3 className="text-base font-bold text-white">Registered Teachers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d0f14]/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Assignments (Subject @ Class)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {data.teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{t.name}</td>
                    <td className="px-6 py-4 text-gray-400">{t.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {t.assignments.length > 0 ? (
                          t.assignments.map((as, idx) => (
                            <span key={idx} className="text-xs px-2.5 py-1 bg-[#0d0f14]/50 border border-gray-800 text-gray-300 rounded-lg font-medium">
                              {as.subject} ({as.class})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">No classes assigned</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Roster */}
        <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-800/80">
            <h3 className="text-base font-bold text-white">Registered Students</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d0f14]/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Class Group</th>
                  <th className="px-6 py-4">Academic Average</th>
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
