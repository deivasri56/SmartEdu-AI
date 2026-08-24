"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Calendar, Plus, Save, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Activity {
  id: string;
  name: string;
  date: string;
  totalMarks: number;
}

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  marks: Record<string, number>; // { [activityId]: score }
}

interface PageData {
  subjectName: string;
  className: string;
  isEditable: boolean;
  activities: Activity[];
  students: Student[];
}

export default function SubjectActivitiesPage() {
  const { id } = useParams() as { id: string }; // subjectId
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Activity to enter marks for
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  
  // Marks state: { [studentId]: score }
  const [editedMarks, setEditedMarks] = useState<Record<string, string>>({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksSuccess, setMarksSuccess] = useState(false);

  // New Activity Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actName, setActName] = useState("");
  const [actDate, setActDate] = useState("");
  const [actTotal, setActTotal] = useState(50);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadData() {
    try {
      const res = await fetch(`/api/teacher/subjects/${id}/activities`);
      if (!res.ok) throw new Error("Failed to load subject activities");
      const json: PageData = await res.json();
      setData(json);

      if (json.activities.length > 0 && !selectedActivityId) {
        // Default to first activity
        setSelectedActivityId(json.activities[0].id);
        initializeMarks(json.activities[0].id, json.students);
      } else if (selectedActivityId) {
        initializeMarks(selectedActivityId, json.students);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const initializeMarks = (activityId: string, studentsList: Student[]) => {
    const initial: Record<string, string> = {};
    studentsList.forEach((st) => {
      const existingScore = st.marks[activityId];
      initial[st.id] = existingScore !== undefined ? String(existingScore) : "";
    });
    setEditedMarks(initial);
  };

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivityId(activityId);
    setMarksSuccess(false);
    if (data) {
      initializeMarks(activityId, data.students);
    }
  };

  const handleMarkChange = (studentId: string, value: string) => {
    setEditedMarks((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/teacher/subjects/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: actName,
          date: actDate,
          totalMarks: actTotal,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create activity");
      }

      setActName("");
      setActDate("");
      setActTotal(50);
      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedActivityId) return;
    setSavingMarks(true);
    setMarksSuccess(false);

    try {
      const res = await fetch(`/api/teacher/activities/${selectedActivityId}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: editedMarks }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to save marks");
      }

      setMarksSuccess(true);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingMarks(false);
    }
  };

  const activeActivity = data?.activities.find((a) => a.id === selectedActivityId);

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
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Class</span>
        </button>

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600/20 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-indigo-500/30 flex items-center gap-1 w-fit">
                <BookOpen className="h-3.5 w-3.5" />
                Subject Activities & Gradebook
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-3">
                {data?.subjectName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{data?.className}</p>
            </div>

            {data?.isEditable && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10"
              >
                <Plus className="h-4 w-4" />
                <span>Create Activity</span>
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl text-sm">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar: Activities List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Activities List</h3>
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-4 space-y-2">
                {data?.activities && data.activities.length > 0 ? (
                  data.activities.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => handleActivitySelect(act.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        selectedActivityId === act.id
                          ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                          : "bg-[#0d0f14]/45 border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-white"
                      }`}
                    >
                      <span className="font-bold text-sm block">{act.name}</span>
                      <span className="text-[10px] text-gray-500 mt-1 block flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(act.date).toLocaleDateString()}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-6">No activities defined yet.</p>
                )}
              </div>
            </div>

            {/* Main Area: Students Gradebook Table */}
            <div className="lg:col-span-3 space-y-6">
              {activeActivity ? (
                <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-gray-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0d0f14]/10">
                    <div>
                      <h3 className="text-lg font-bold text-white">{activeActivity.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Grade student work out of a maximum of <span className="font-bold text-indigo-400">{activeActivity.totalMarks} marks</span>.
                      </p>
                    </div>

                    {data?.isEditable && (
                      <button
                        onClick={handleSaveMarks}
                        disabled={savingMarks}
                        className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Save className="h-4 w-4" />
                        <span>{savingMarks ? "Saving..." : "Save Marks"}</span>
                      </button>
                    )}
                  </div>

                  {marksSuccess && (
                    <div className="m-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-semibold">
                      Student activity marks successfully recorded and updated.
                    </div>
                  )}

                  {/* Student Marks Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0d0f14]/30 text-gray-400 text-xs font-semibold uppercase border-b border-gray-800/80">
                          <th className="py-4 px-6">Register Number</th>
                          <th className="py-4 px-6">Student Name</th>
                          <th className="py-4 px-6">Marks Scored</th>
                          <th className="py-4 px-6">Max Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
                        {data?.students.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-800/10 transition-colors">
                            <td className="py-4 px-6 font-semibold text-gray-400">#{student.rollNumber}</td>
                            <td className="py-4 px-6 font-bold text-white">{student.name}</td>
                            <td className="py-4 px-6">
                              {data.isEditable ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={activeActivity.totalMarks}
                                  value={editedMarks[student.id] ?? ""}
                                  onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                  placeholder="Enter score"
                                  className="bg-[#0d0f14] border border-gray-800 rounded-lg px-3 py-1.5 w-24 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                              ) : (
                                <span className="font-bold text-white">
                                  {student.marks[activeActivity.id] ?? "Not graded"}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-gray-500">{activeActivity.totalMarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-12 text-center text-gray-500">
                  <Award className="h-10 w-10 mx-auto text-gray-600 mb-4" />
                  <h3 className="font-bold text-white mb-1">Gradebook Empty</h3>
                  <p className="text-xs">Create an activity to start recording student performance marks.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Create Activity Modal ─── */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151922] border border-gray-800 rounded-3xl p-6 w-full max-w-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Create Subject Activity</h3>
                <p className="text-gray-400 text-xs mt-1">Define a new assessment task, quiz, or homework activity.</p>
              </div>

              {formError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateActivity} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={actName}
                    onChange={(e) => setActName(e.target.value)}
                    placeholder="e.g. Midterm Lab Assessment"
                    className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={actDate}
                      onChange={(e) => setActDate(e.target.value)}
                      className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={actTotal}
                      onChange={(e) => setActTotal(Number(e.target.value))}
                      className="w-full bg-[#0d0f14] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
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
                    disabled={creating}
                    className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    {creating ? "Creating..." : "Save Activity"}
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
