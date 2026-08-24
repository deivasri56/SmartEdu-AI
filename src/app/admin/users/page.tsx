"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users } from "lucide-react";

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

export default function AdminUsers() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setTeachers(json.teachers);
          setStudents(json.students);
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

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-400" />
            <span>Manage Users</span>
          </h1>
          <p className="text-gray-400 text-sm">Rosters of registered Students and Teachers.</p>
        </div>

        {/* Teachers Roster */}
        <div className="bg-[#151922] border border-gray-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
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
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 font-bold text-white">{t.name}</td>
                    <td className="px-6 py-4 text-gray-400">{t.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {t.assignments.map((as, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 bg-[#0d0f14]/50 border border-gray-800 text-gray-300 rounded-lg font-medium">
                            {as.subject} ({as.class})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Roster */}
        <div className="bg-[#151922] border border-gray-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
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
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 font-bold text-white">{s.name}</td>
                    <td className="px-6 py-4 text-gray-400">{s.email}</td>
                    <td className="px-6 py-4">{s.class}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-400">{s.gpa}%</td>
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
