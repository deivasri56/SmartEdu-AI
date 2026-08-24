"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Search, User, Star, ArrowLeft, Plus, BookOpen, Settings } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  average: number;
  status: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  subjectIncharge: string;
  subjectInchargeId: string | null;
}

interface Teacher {
  id: string;
  name: string;
}

interface ClassData {
  className: string;
  isIncharge: boolean;
  students: Student[];
}

export default function ClassStudentsPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<ClassData | null>(null);
  const [subjectsData, setSubjectsData] = useState<{
    isIncharge: boolean;
    subjects: Subject[];
    teachers: Teacher[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Subject Creation Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubCredits, setNewSubCredits] = useState(3);
  const [newSubIncharge, setNewSubIncharge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function fetchClassAndSubjects() {
    try {
      const [resStudents, resSubjects] = await Promise.all([
        fetch(`/api/teacher/classes/${id}/students`),
        fetch(`/api/teacher/classes/${id}/subjects`),
      ]);

      if (!resStudents.ok) throw new Error("Failed to load class roster");
      const studentsJson = await resStudents.json();
      setData(studentsJson);

      if (resSubjects.ok) {
        const subjectsJson = await resSubjects.json();
        setSubjectsData(subjectsJson);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load class data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClassAndSubjects();
  }, [id]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/teacher/classes/${id}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubName,
          code: newSubCode,
          credits: newSubCredits,
          subjectInchargeId: newSubIncharge || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create subject");
      }

      // Reset form and refresh
      setNewSubName("");
      setNewSubCode("");
      setNewSubCredits(3);
      setNewSubIncharge("");
      setShowCreateModal(false);
      await fetchClassAndSubjects();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = data?.students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "Excellent": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Good": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "Needs Attention": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-gray-800 text-gray-400 border border-gray-700/50";
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-8">
        {/* Back Link */}
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Classes</span>
        </Link>

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600/20 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-indigo-500/30 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Class Group
                </span>
                {data?.isIncharge && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-300" />
                    Class Incharge
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                {data?.className || "Class Roster"}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {data?.isIncharge
                  ? "Manage subjects, assign teachers, and track overall student progress."
                  : "View details of your assigned subjects and students in this class."}
              </p>
            </div>

            {/* Create Subject Trigger (Class Incharge Only) */}
            {data?.isIncharge && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10"
              >
                <Plus className="h-4 w-4" />
                <span>Create Subject</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl text-sm">
            {error}
          </div>
        )}

        {/* ─── Subjects Section ─── */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Class Subjects
          </h2>
          {subjectsData?.subjects && subjectsData.subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjectsData.subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-gray-700 transition-all"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{sub.name}</h3>
                    <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">
                      Code: {sub.code}
                    </span>
                    <div className="mt-4 space-y-2 text-xs text-gray-400">
                      <div>
                        <span className="font-semibold text-gray-500">Credits:</span> {sub.credits}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-500">Subject Incharge:</span> {sub.subjectIncharge}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/teacher/subjects/${sub.id}/activities`}
                    className="w-full py-2.5 mt-6 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Manage Activities & Marks</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No subjects mapped to this class.</p>
          )}
        </div>

        {/* ─── Enrolled Students Section ─── */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
            <Users className="h-4 w-4" />
            Enrolled Students
          </h2>
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
            {/* Table Search Header */}
            <div className="p-6 border-b border-gray-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0d0f14]/10">
              <h3 className="text-lg font-bold text-white">Student Roster ({filteredStudents.length})</h3>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search students by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d0f14]/30 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800/80">
                    <th className="py-4 px-6">Register Number</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Academic Average</th>
                    <th className="py-4 px-6">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-800/10 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-400">#{student.rollNumber}</td>
                      <td className="py-4 px-6">
                        <Link
                          href={`/student/twin?studentId=${student.id}`}
                          className="font-bold text-white hover:text-indigo-400 transition-colors"
                        >
                          {student.name}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-white">{student.average}%</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${statusBadgeColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                        No students found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Create Subject Modal ─── */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151922] border border-gray-800 rounded-3xl p-6 w-full max-w-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Create New Subject</h3>
                <p className="text-gray-400 text-xs mt-1">Add a new academic course group for {data?.className}.</p>
              </div>

              {formError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="e.g. Applied Physics"
                    className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      required
                      value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value)}
                      placeholder="e.g. PHY101"
                      className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Credits
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10}
                      value={newSubCredits}
                      onChange={(e) => setNewSubCredits(Number(e.target.value))}
                      className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Assign Subject Incharge
                  </label>
                  <select
                    value={newSubIncharge}
                    onChange={(e) => setNewSubIncharge(e.target.value)}
                    className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">-- Select Teacher --</option>
                    {subjectsData?.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    {submitting ? "Creating..." : "Save Subject"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
