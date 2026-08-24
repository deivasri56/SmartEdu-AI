"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Layers } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  studentCount: number;
  createdAt: string;
}

export default function AdminClasses() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setClasses(json.classes);
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
            <Layers className="h-6 w-6 text-purple-400" />
            <span>Manage Classes</span>
          </h1>
          <p className="text-gray-400 text-sm">Class divisions and student enrollments overview.</p>
        </div>

        <div className="bg-[#151922] border border-gray-800 rounded-3xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d0f14]/30 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800">
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-4">Students Enrolled</th>
                  <th className="py-4 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td className="py-4 px-4 font-bold text-white">{c.name}</td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-gray-800 text-emerald-400 text-xs font-semibold border border-gray-700 rounded-lg">
                        {c.studentCount} students
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500">{c.createdAt}</td>
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
