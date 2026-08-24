"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Award, BookOpen } from "lucide-react";

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

interface ActivityMark {
  id: string;
  subjectName: string;
  subjectCode: string;
  activityName: string;
  date: string;
  totalMarks: number;
  score: number | null;
}

export default function StudentMarks() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [activities, setActivities] = useState<ActivityMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"grades" | "activities">("grades");

  useEffect(() => {
    async function fetchData() {
      try {
        const [gradesRes, activitiesRes] = await Promise.all([
          fetch("/api/student/dashboard"),
          fetch("/api/student/activities"),
        ]);

        if (gradesRes.ok) {
          const json = await gradesRes.json();
          setGrades(json.grades);
        }
        if (activitiesRes.ok) {
          const json = await activitiesRes.json();
          setActivities(json.activities);
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

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Academic Marks</h1>
          <p className="text-gray-400 text-sm">Detailed history of all assessments, class activities, and marks.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-4 border-b border-gray-800 pb-px">
          <button
            onClick={() => setActiveTab("grades")}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === "grades" ? "text-indigo-400" : "text-gray-400 hover:text-white"
            }`}
          >
            Assessments (Exams & Quizzes)
            {activeTab === "grades" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`pb-3 font-semibold text-sm transition-colors relative ${
              activeTab === "activities" ? "text-indigo-400" : "text-gray-400 hover:text-white"
            }`}
          >
            Class Activities & Lab Marks
            {activeTab === "activities" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === "grades" ? (
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
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
                  {grades.length > 0 ? (
                    grades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{grade.subject}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium rounded-full">
                            {grade.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-indigo-400">{grade.score}</span>
                          <span className="text-gray-500"> / {grade.maxScore}</span>
                          <span className="text-xs text-gray-500 block">({grade.percentage}%)</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(grade.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-xs italic text-gray-400">
                          {grade.comments || "No comments provided"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No grade records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d0f14]/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Activity</th>
                    <th className="px-6 py-4">Marks Scored</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                  {activities.length > 0 ? (
                    activities.map((act) => (
                      <tr key={act.id} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">
                          {act.subjectName} <span className="text-xs text-gray-500 font-normal">({act.subjectCode})</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-300">{act.activityName}</td>
                        <td className="px-6 py-4">
                          {act.score !== null ? (
                            <>
                              <span className="font-bold text-indigo-400">{act.score}</span>
                              <span className="text-gray-500"> / {act.totalMarks}</span>
                            </>
                          ) : (
                            <span className="text-gray-500 italic">Not graded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(act.date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        No class activity marks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
