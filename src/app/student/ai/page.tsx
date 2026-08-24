"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
  Target,
  Send,
  Loader2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Lightbulb,
  Zap,
  CheckCircle,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────
interface WeakTopic {
  subject: string;
  topic: string;
  reason: string;
  score: number;
  severity: "high" | "medium" | "low";
}

interface PriorityTopic {
  subject: string;
  topic: string;
  evidence: string;
  score: number;
}

interface PersonalizedNextStep {
  action: string;
  reason: string;
  timeframe: string;
}

interface StudyRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  subject: string;
}

interface WorkflowResult {
  weakTopics: WeakTopic[];
  priorityTopics: PriorityTopic[];
  personalizedNextSteps: PersonalizedNextStep[];
  studyRecommendation: StudyRecommendation[];
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface WorkflowStep {
  id: string;
  name: string;
  status: "idle" | "running" | "done" | "error";
  message: string;
}

// ─── Component ─────────────────────────────────────────
export default function StudentAIPage() {
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  // Workflow steps status
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: "analyzing", name: "Performance Analysis", status: "idle", message: "Extracting average score, trends, and subject-wise levels" },
    { id: "insights", name: "Insight Detection", status: "idle", message: "Identifying learning gaps and priority areas" },
    { id: "recommending", name: "Recommendation Generation", status: "idle", message: "Creating personalized study plan and next steps" },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Run the agentic workflow stream
  const executeWorkflow = async () => {
    setWorkflowLoading(true);
    setWorkflowError(null);
    setNoData(false);
    setWorkflowResult(null);

    // Reset steps
    setSteps([
      { id: "analyzing", name: "Performance Analysis", status: "idle", message: "Extracting average score, trends, and subject-wise levels" },
      { id: "insights", name: "Insight Detection", status: "idle", message: "Identifying learning gaps and priority areas" },
      { id: "recommending", name: "Recommendation Generation", status: "idle", message: "Creating personalized study plan and next steps" },
    ]);

    try {
      const response = await fetch("/api/student/ai/insights");
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || "Failed to initiate agentic workflow");
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        if (json.message && !json.insights) {
          setNoData(true);
          setWorkflowLoading(false);
          return;
        }
      }

      // Stream the reader
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Unable to read streaming workflow updates.");

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line);

          if (chunk.step === "error") {
            throw new Error(chunk.message);
          }

          if (chunk.step === "done") {
            setWorkflowResult(chunk.data);
            setSteps((prev) =>
              prev.map((s) => ({ ...s, status: "done" }))
            );
          } else {
            // Update active step status
            setSteps((prev) =>
              prev.map((s) => {
                if (s.id === chunk.step) {
                  return { ...s, status: "running", message: chunk.message };
                }
                // Mark previous steps as done
                const currentIndex = prev.findIndex((item) => item.id === chunk.step);
                const stepIndex = prev.findIndex((item) => item.id === s.id);
                if (stepIndex < currentIndex) {
                  return { ...s, status: "done" };
                }
                return s;
              })
            );
          }
        }
      }
    } catch (err: any) {
      setWorkflowError(err.message || "An error occurred during workflow execution.");
      setSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "error", message: err.message } : s))
      );
    } finally {
      setWorkflowLoading(false);
    }
  };

  useEffect(() => {
    executeWorkflow();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send chat message
  const handleSendMessage = async (msg?: string) => {
    const text = msg || chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/student/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to get response");

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: json.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `⚠️ ${err.message || "Something went wrong. Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are my weakest areas?",
    "How can I improve in Math?",
    "What should I study this week?",
    "Am I on track for good grades?",
  ];

  const severityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "low": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-rose-400 border-rose-500/30";
      case "medium": return "text-amber-400 border-amber-500/30";
      case "low": return "text-emerald-400 border-emerald-500/30";
      default: return "text-gray-400 border-gray-500/30";
    }
  };

  // ─── Render ──────────────────────────────────────────
  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 to-indigo-500/10 border border-purple-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI Agentic Workflow
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                Academic Recommendation Workflow
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Watch the multi-agent execution pipeline structure your academic data and build recommendations.
              </p>
            </div>
            <button
              onClick={executeWorkflow}
              disabled={workflowLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-purple-400 text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${workflowLoading ? "animate-spin" : ""}`}
              />
              <span>Trigger Workflow</span>
            </button>
          </div>
        </div>

        {/* ─── Workflow Execution Status Visualizer ─── */}
        <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
          <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-400" />
            Agent execution trace: Academic Data → Performance Analysis → Insight Detection → Recommendation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-4 border rounded-2xl relative transition-all duration-300 ${
                  step.status === "running"
                    ? "bg-purple-500/10 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    : step.status === "done"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : step.status === "error"
                    ? "bg-rose-500/5 border-rose-500/30"
                    : "bg-[#0d0f14]/50 border-gray-800/60 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Agent {idx + 1}</span>
                  {step.status === "running" && (
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  )}
                  {step.status === "done" && (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  )}
                  {step.status === "error" && (
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{step.name}</h4>
                <p className="text-xs text-gray-500 leading-normal">{step.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Insights Section ─── */}
        {workflowLoading && !workflowResult ? (
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-8 text-center animate-pulse">
            <Loader2 className="h-10 w-10 text-purple-400 mx-auto mb-3 animate-spin" />
            <p className="text-gray-400 font-semibold mb-1">
              Workflow Executing...
            </p>
            <p className="text-gray-600 text-sm">
              Please wait while logical agents complete analysis tasks.
            </p>
          </div>
        ) : workflowError ? (
          <div className="bg-[#151922] border border-rose-500/20 rounded-3xl p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-400 font-semibold mb-2">
              Workflow Failure
            </p>
            <p className="text-gray-500 text-sm mb-4">{workflowError}</p>
            <button
              onClick={executeWorkflow}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold transition-all"
            >
              Retry Workflow
            </button>
          </div>
        ) : noData ? (
          <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-8 text-center">
            <BrainCircuit className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold mb-1">
              No Academic Data Yet
            </p>
            <p className="text-gray-600 text-sm">
              AI recommendations will appear once you have assessment results recorded.
            </p>
          </div>
        ) : workflowResult ? (
          <>
            {/* Insight Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weak Topics */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                  <h3 className="text-lg font-bold text-white">Weak Topics</h3>
                </div>
                <div className="space-y-3">
                  {workflowResult.weakTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      className={`p-4 border rounded-2xl ${severityColor(topic.severity)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {topic.subject}
                        </span>
                        <span className="text-xs font-bold">{topic.score}%</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {topic.topic}
                      </h4>
                      <p className="text-xs text-gray-400">{topic.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Topics */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">
                    Priority Topics
                  </h3>
                </div>
                <div className="space-y-3">
                  {workflowResult.priorityTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          {topic.subject}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {topic.score}%
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {topic.topic}
                      </h4>
                      <p className="text-xs text-gray-400">{topic.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Recommendations */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">
                    Study Recommendations
                  </h3>
                </div>
                <div className="space-y-3">
                  {workflowResult.studyRecommendation.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#0d0f14]/50 border border-gray-800 rounded-2xl hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md ${priorityColor(rec.priority)}`}
                        >
                          {rec.priority}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                          {rec.subject}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Next Steps */}
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">
                    Personalized Next Steps
                  </h3>
                </div>
                <div className="space-y-3">
                  {workflowResult.personalizedNextSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                          <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
                          {step.action}
                        </h4>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          {step.timeframe}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 ml-5">
                        {step.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* ─── Chat Section ─── */}
        <div className="bg-[#151922] border border-gray-800/80 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-800/80 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Academic Copilot Chat
              </h3>
              <p className="text-xs text-gray-500">
                Ask anything about your academics — answers are based on your
                real performance data.
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-[400px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <BrainCircuit className="h-12 w-12 text-gray-700 mb-3" />
                <p className="text-gray-500 text-sm font-medium mb-4">
                  Start a conversation with your Academic Copilot
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-full text-purple-400 text-xs font-medium transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-purple-600/20 border border-purple-500/20 text-white"
                        : "bg-[#0d0f14]/80 border border-gray-800 text-gray-300"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                          Copilot
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#0d0f14]/80 border border-gray-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  <span className="text-xs text-gray-500">
                    Copilot is thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-800/80 bg-[#0d0f14]/30">
            <div className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your academics..."
                className="flex-1 bg-[#151922] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
