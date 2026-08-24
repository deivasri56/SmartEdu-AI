"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PlusCircle, AlertCircle, CheckCircle, Loader2, Trash2 } from "lucide-react";

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

interface GradeRecord {
  id: string;
  studentName: string;
  className: string;
  subjectName: string;
  subjectCode: string;
  type: string;
  score: number;
  maxScore: number;
  date: string;
  comments: string;
}

export default function TeacherGrades() {
  const [data, setData] = useState<{ assignments: Assignment[]; students: Student[] } | null>(null);
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"roster" | "records">("roster");

  // Form States
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [gradeType, setGradeType] = useState("Exam");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/teacher/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.assignments.length > 0) {
          setSelectedSubject(json.assignments[0].subjectId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGradeRecords = async () => {
    try {
      const res = await fetch("/api/teacher/grades");
      if (res.ok) {
        const json = await res.json();
        setGradeRecords(json.grades);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchData(), fetchGradeRecords()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/teacher/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId: selectedStudent,
          subjectId: selectedSubject,
          type: gradeType,
          score: parseFloat(score),
          maxScore: parseFloat(maxScore),
          comments,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to submit grade");
      }

      setSuccess("Grade recorded successfully!");
      setScore("");
      setComments("");
      await Promise.all([fetchData(), fetchGradeRecords()]);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm("Are you sure you want to delete this grade record?")) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/teacher/grades/${gradeId}`, {
        method: "DELETE",
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to delete grade");
      }

      setSuccess("Grade record deleted successfully.");
      await Promise.all([fetchData(), fetchGradeRecords()]);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Grades & Marks</h1>
          <p className="text-gray-400 text-sm">Enter, update and audit academic grades for students.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Roster / Record List */}
          <div className="bg-[#151922] border border-gray-800 rounded-3xl overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-800 px-6 pt-5 bg-[#0d0f14]/15">
              <button
                onClick={() => setActiveTab("roster")}
                className={`pb-3 font-semibold text-sm transition-colors relative ${
                  activeTab === "roster" ? "text-indigo-400" : "text-gray-400 hover:text-white"
                }`}
              >
                Student Roster
                {activeTab === "roster" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("records")}
                className={`pb-3 font-semibold text-sm transition-colors relative ${
                  activeTab === "records" ? "text-indigo-400" : "text-gray-400 hover:text-white"
                }`}
              >
                Recorded Grades Log ({gradeRecords.length})
                {activeTab === "records" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            </div>

            {activeTab === "roster" ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0d0f14]/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Class</th>
                      <th className="px-6 py-4">GPA</th>
                      <th className="px-6 py-4">Grades Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                    {data?.students.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-800/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{s.name}</td>
                        <td className="px-6 py-4">{s.class}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">{s.gpa}%</td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500">{s.totalGradesRecorded}</td>
                      </tr>
                    ))}
                    {data?.students.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No students enrolled in your classes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0d0f14]/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                    {gradeRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-800/10 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-white block">{rec.studentName}</span>
                          <span className="text-[10px] text-gray-500">{rec.className}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-300 block">{rec.subjectName}</span>
                          <span className="text-[10px] text-indigo-400 uppercase font-semibold">{rec.subjectCode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded font-medium">
                            {rec.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-indigo-400">{rec.score}</span>
                          <span className="text-gray-500"> / {rec.maxScore}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">{rec.date}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteGrade(rec.id)}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Grade"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {gradeRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No grades recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
