"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen } from "lucide-react";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setSubjects(json.subjects);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-400" />
            <span>Manage Subjects</span>
          </h1>
          <p className="text-gray-400 text-sm">Overview of registerable subjects and syllabus codes.</p>
        </div>

        <div className="bg-[#151922] border border-gray-800 rounded-3xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d0f14]/30 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800">
                  <th className="py-4 px-4">Subject Name</th>
                  <th className="py-4 px-4">Subject Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td className="py-4 px-4 font-bold text-white">{sub.name}</td>
                    <td className="py-4 px-4">
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
    </DashboardLayout>
  );
}
