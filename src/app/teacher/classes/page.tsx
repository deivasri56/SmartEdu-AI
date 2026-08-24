"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Users, Star, ArrowRight, Trash2, AlertTriangle, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";

interface ClassIncharge {
  id: string;
  name: string;
  isIncharge: boolean;
}

interface TeachingClass {
  id: string;
  name: string;
  subjects: string[];
}

interface ClassesData {
  classIncharge: ClassIncharge | null;
  teachingClasses: TeachingClass[];
}

export default function TeacherClasses() {
  const [data, setData] = useState<ClassesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create Class Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);

  // Deletion Confirmation Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");
  const [confirmDeleteIsIncharge, setConfirmDeleteIsIncharge] = useState<boolean>(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchClasses() {
    try {
      const res = await fetch("/api/teacher/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create class");

      setNewClassName("");
      setShowCreateModal(false);
      await fetchClasses();
    } catch (err: any) {
      setError(err.message || "Failed to create class");
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/classes/${confirmDeleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete class");
      
      // Refresh list
      await fetchClasses();
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the class");
    } finally {
      setDeleting(false);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Classes</h1>
            <p className="text-gray-400 text-sm mt-1">Overview of your Class Incharge group and subject teaching assignments.</p>
          </div>
          {!data?.classIncharge && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Class</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl text-sm">
            {error}
          </div>
        )}

        {/* ─── Class Incharge Section ─── */}
        {data?.classIncharge && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-indigo-400" />
              Class Incharge Assignment
            </h2>
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-500/10 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-indigo-500/30">
                    Class Incharge
                  </span>
                  <h3 className="text-xl font-bold text-white mt-3">{data.classIncharge.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    You have full administrative access to all student profiles in this class.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 self-stretch sm:self-auto">
                  <Link
                    href={`/teacher/classes/${data.classIncharge.id}`}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all justify-center"
                  >
                    <span>Manage Class</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setConfirmDeleteId(data.classIncharge!.id);
                      setConfirmDeleteName(data.classIncharge!.name);
                      setConfirmDeleteIsIncharge(true);
                    }}
                    className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Class</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Other Teaching Classes ─── */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Teaching Subject Assignments
          </h2>
          {data?.teachingClasses && data.teachingClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.teachingClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-gray-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">{cls.name}</h3>
                      <div className="p-2.5 bg-gray-800 rounded-xl text-indigo-400">
                        <BookOpen className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {cls.subjects.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Link
                      href={`/teacher/classes/${cls.id}`}
                      className="w-full py-2.5 bg-[#0d0f14] hover:bg-gray-800/50 border border-gray-800 rounded-xl font-semibold text-xs text-gray-300 flex items-center justify-center gap-1 transition-all"
                    >
                      <span>View Class Roster</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => {
                        setConfirmDeleteId(cls.id);
                        setConfirmDeleteName(cls.name);
                        setConfirmDeleteIsIncharge(false);
                      }}
                      className="w-full py-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/15 rounded-xl font-semibold text-xs text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Assignment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No additional teaching assignments mapped.</p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151922] border border-gray-800 rounded-3xl p-6 w-full max-w-md space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {confirmDeleteIsIncharge ? "Delete Class entirely?" : "Remove Subject Assignment?"}
                </h3>
                <p className="text-gray-400 text-xs mt-1">Class: {confirmDeleteName}</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              {confirmDeleteIsIncharge
                ? "Warning: Deleting this class will delete all enrolled student profiles, subject listings, activities, and marks recorded for this class. This action is permanent and cannot be undone."
                : "This will remove your teaching assignment and hide this class from your dashboard. It will not delete the class itself."}
            </p>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-xs transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClass}
                disabled={deleting}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{confirmDeleteIsIncharge ? "Delete Class" : "Remove"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151922] border border-gray-800 rounded-3xl p-6 w-full max-w-md space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Create New Class</h3>
              <p className="text-gray-400 text-xs mt-1">Define a new student class group where you will be Class Incharge.</p>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Class 10-A"
                  className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-semibold text-xs transition-colors"
                  disabled={creatingClass}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClass}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  {creatingClass ? "Creating..." : "Save Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
