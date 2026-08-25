import { generateAIResponse, generateStructuredAIResponse } from "./gemini";

// Helper to check if Gemini is available
function isGeminiAvailable() {
  return !!process.env.GEMINI_API_KEY;
}

// ─────────────────────────────────────────────────────────
// Agent 1: Performance Analyzer Agent
// ─────────────────────────────────────────────────────────
const STUDENT_ANALYZER_PROMPT = `You are the Performance Analyzer Agent.
Analyze the following student academic data. Focus on extracting:
1. Overall average score and trends.
2. Subject-wise performance levels.
3. Topic-wise strength/weakness indicators from exam types and comments.

Return a JSON object with this structure:
{
  "overallTrend": "Description of trend",
  "averageScore": number,
  "subjectPerformance": [
    { "subject": "Math", "average": 75, "status": "excellent" | "passing" | "struggling" }
  ],
  "topicObservations": [
    { "topic": "Algebra", "score": 85, "observations": "strong details" }
  ]
}`;

const TEACHER_ANALYZER_PROMPT = `You are the Performance Analyzer Agent.
Analyze the following class performance data. Focus on extracting:
1. Class average scores across subjects.
2. Participation/submission rates.
3. Class-wide performance trends.

Return a JSON object with this structure:
{
  "classAverage": number,
  "subjectStats": [
    { "subject": "Math", "average": 72, "trend": "improving" | "stable" | "declining" }
  ],
  "participationRate": number
}`;

// ─────────────────────────────────────────────────────────
// Agent 2: Academic Insight Agent
// ─────────────────────────────────────────────────────────
const STUDENT_INSIGHT_PROMPT = `You are the Academic Insight Agent.
Take the performance analysis and identify:
1. Specific weak areas and learning gaps.
2. High-priority topics that need immediate attention.
3. Patterns of performance drops or improvements.

Return a JSON object with this structure:
{
  "weakAreas": [
    { "subject": "Math", "topic": "Calculus", "reason": "Specific gap description", "score": 52 }
  ],
  "priorityTopics": [
    { "subject": "Math", "topic": "Calculus", "urgency": "high" | "medium" }
  ],
  "patterns": ["Found pattern 1", "Found pattern 2"]
}`;

const TEACHER_INSIGHT_PROMPT = `You are the Academic Insight Agent.
Take the class performance analysis and identify:
1. Class-wide weak topics.
2. Students needing immediate academic attention or support.
3. Risks or patterns in submissions and scores.

Return a JSON object with this structure:
{
  "classWeakTopics": [
    { "subject": "Math", "topic": "Calculus", "classAverage": 58, "affectedStudents": ["Student A", "Student B"] }
  ],
  "studentsNeedingAttention": [
    { "name": "Student A", "className": "Class 10", "averageScore": 48, "weakSubjects": ["Math"], "gaps": "Specific gap description" }
  ],
  "risks": ["Found risk 1", "Found risk 2"]
}`;

// ─────────────────────────────────────────────────────────
// Agent 3: Recommendation Agent
// ─────────────────────────────────────────────────────────
const STUDENT_RECOMMENDATION_PROMPT = `You are the Recommendation Agent.
Take the academic insights and convert them into final actionable student recommendations.
Return a JSON object with EXACTLY this structure:
{
  "weakTopics": [
    { "subject": "Math", "topic": "Calculus", "reason": "Specific gap", "score": 52, "severity": "high" | "medium" | "low" }
  ],
  "priorityTopics": [
    { "subject": "Math", "topic": "Calculus", "evidence": "Low test score", "score": 52 }
  ],
  "personalizedNextSteps": [
    { "action": "Step action", "reason": "Why it helps", "timeframe": "This week" }
  ],
  "studyRecommendation": [
    { "title": "Title", "description": "Description", "priority": "high" | "medium" | "low", "subject": "Math" }
  ]
}`;

const TEACHER_RECOMMENDATION_PROMPT = `You are the Recommendation Agent.
Take the class insights and convert them into final teaching recommendations.
Return a JSON object with EXACTLY this structure:
{
  "classWeakTopics": [
    { "subject": "Math", "topic": "Calculus", "classAverage": 58, "affectedStudents": ["Student A"], "recommendation": "Suggested action" }
  ],
  "studentsNeedingAttention": [
    { "name": "Student A", "className": "Class 10", "averageScore": 48, "weakSubjects": ["Math"], "specificGaps": "Details", "suggestedIntervention": "Action" }
  ],
  "suggestedTeachingActions": [
    { "title": "Action Title", "description": "Details", "priority": "high" | "medium" | "low", "targetGroup": "Class" }
  ],
  "recommendedNextAssessment": [
    { "subject": "Math", "topic": "Calculus", "suggestedType": "Quiz", "timeframe": "Next week" }
  ]
}`;

// ─────────────────────────────────────────────────────────
// Workflow Executors
// ─────────────────────────────────────────────────────────

export async function* runStudentAgenticWorkflow(data: any) {
  if (!isGeminiAvailable()) {
    // Return Fallback/Dummy Data step by step to simulate
    yield { step: "analyzing", message: "Analyzing grades and trend data (Fallback)..." };
    await new Promise((resolve) => setTimeout(resolve, 800));
    yield { step: "insights", message: "Identifying learning gaps and priority areas..." };
    await new Promise((resolve) => setTimeout(resolve, 800));
    yield { step: "recommending", message: "Creating personalized recommendations..." };
    await new Promise((resolve) => setTimeout(resolve, 800));

    const fallbackResult = {
      weakTopics: [
        { subject: "Mathematics", topic: "Integration by Parts", reason: "Scored 45% in recent quiz", score: 45, severity: "high" },
        { subject: "Physics", topic: "Electromagnetism", reason: "Midterm score below average", score: 58, severity: "medium" }
      ],
      priorityTopics: [
        { subject: "Mathematics", topic: "Integration by Parts", evidence: "Essential for upcoming exams", score: 45 }
      ],
      personalizedNextSteps: [
        { action: "Review textbook chapter 4", reason: "Build core conceptual base", timeframe: "This week" },
        { action: "Attempt integration worksheets", reason: "Apply formula variations", timeframe: "Next 2 weeks" }
      ],
      studyRecommendation: [
        { title: "Targeted Practice: Integration", description: "Dedicate 30 mins daily to basic Integration problems.", priority: "high", subject: "Mathematics" }
      ]
    };
    yield { step: "done", data: fallbackResult };
    return;
  }

  try {
    // Step 1: Performance Analysis
    yield { step: "analyzing", message: "Running Performance Analyzer Agent..." };
    const analysis = await generateStructuredAIResponse<any>(
      STUDENT_ANALYZER_PROMPT,
      JSON.stringify(data)
    );

    // Step 2: Insight Detection
    yield { step: "insights", message: "Running Academic Insight Agent..." };
    const insights = await generateStructuredAIResponse<any>(
      STUDENT_INSIGHT_PROMPT,
      JSON.stringify({ originalData: data, analysis })
    );

    // Step 3: Recommendation
    yield { step: "recommending", message: "Running Recommendation Agent..." };
    const recommendations = await generateStructuredAIResponse<any>(
      STUDENT_RECOMMENDATION_PROMPT,
      JSON.stringify({ analysis, insights })
    );

    yield { step: "done", data: recommendations };
  } catch (err: any) {
    console.warn("AI workflow failed, building data-driven fallback:", err.message);

    // Build fallback from real data
    const grades = data.grades || [];
    const subjectAverages = data.subjectAverages || [];

    // Identify weak topics from real averages
    const weakTopics = subjectAverages
      .filter((s: any) => s.average < 70)
      .map((s: any) => ({
        subject: s.name,
        topic: `${s.name} Overall`,
        reason: `Average score is ${s.average}%, below the 70% threshold`,
        score: s.average,
        severity: s.average < 50 ? "high" : s.average < 60 ? "medium" : "low"
      }));

    // Priority topics — lowest scoring subjects
    const priorityTopics = [...subjectAverages]
      .sort((a: any, b: any) => a.average - b.average)
      .slice(0, 3)
      .map((s: any) => ({
        subject: s.name,
        topic: `${s.name} Fundamentals`,
        evidence: `Current average: ${s.average}%`,
        score: s.average
      }));

    const personalizedNextSteps = [
      { action: "Review your lowest-scoring subjects", reason: "Focus on areas with the most room for improvement", timeframe: "This week" },
      { action: "Practice recent exam topics", reason: "Reinforce concepts from recent assessments", timeframe: "Next 2 weeks" },
      { action: "Set daily study goals", reason: "Consistent practice improves retention", timeframe: "Ongoing" }
    ];

    const studyRecommendation = subjectAverages
      .filter((s: any) => s.average < 75)
      .slice(0, 3)
      .map((s: any) => ({
        title: `Improve ${s.name}`,
        description: `Your current average in ${s.name} is ${s.average}%. Focus on fundamentals and practice problems.`,
        priority: s.average < 50 ? "high" : s.average < 65 ? "medium" : "low",
        subject: s.name
      }));

    // If no weak areas found, add a generic positive recommendation
    if (studyRecommendation.length === 0) {
      studyRecommendation.push({
        title: "Maintain Your Performance",
        description: "You're performing well across subjects. Keep up the consistent effort!",
        priority: "low",
        subject: "All Subjects"
      });
    }

    const fallbackResult = {
      weakTopics: weakTopics.length > 0 ? weakTopics : [{ subject: "None detected", topic: "Keep it up!", reason: "All subjects are above average", score: 0, severity: "low" }],
      priorityTopics,
      personalizedNextSteps,
      studyRecommendation
    };

    yield { step: "done", data: fallbackResult };
  }
}

export async function* runTeacherAgenticWorkflow(data: any) {
  if (!isGeminiAvailable()) {
    yield { step: "analyzing", message: "Analyzing class marks and averages (Fallback)..." };
    await new Promise((resolve) => setTimeout(resolve, 800));
    yield { step: "insights", message: "Detecting class-level risks and attention areas..." };
    await new Promise((resolve) => setTimeout(resolve, 800));
    yield { step: "recommending", message: "Generating teaching recommendations..." };
    await new Promise((resolve) => setTimeout(resolve, 800));

    const fallbackResult = {
      classWeakTopics: [
        { subject: "Mathematics", topic: "Integration by Parts", classAverage: 62, affectedStudents: ["Student One"], recommendation: "Conduct a 15-minute quick revision session." }
      ],
      studentsNeedingAttention: [
        { name: "Student One", className: "Class 10-A", averageScore: 61, weakSubjects: ["Mathematics"], specificGaps: "Struggles with integral calculus basics", suggestedIntervention: "Offer peer tutoring or extra worksheets." }
      ],
      suggestedTeachingActions: [
        { title: "Revision Session: Calculus Basics", description: "Review basic integration rules with Class 10-A.", priority: "high", targetGroup: "Entire class" }
      ],
      recommendedNextAssessment: [
        { subject: "Mathematics", topic: "Integration", suggestedType: "Pop Quiz", timeframe: "Next week" }
      ]
    };
    yield { step: "done", data: fallbackResult };
    return;
  }

  try {
    yield { step: "analyzing", message: "Running Performance Analyzer Agent..." };
    const analysis = await generateStructuredAIResponse<any>(
      TEACHER_ANALYZER_PROMPT,
      JSON.stringify(data)
    );

    yield { step: "insights", message: "Running Academic Insight Agent..." };
    const insights = await generateStructuredAIResponse<any>(
      TEACHER_INSIGHT_PROMPT,
      JSON.stringify({ originalData: data, analysis })
    );

    yield { step: "recommending", message: "Running Recommendation Agent..." };
    const recommendations = await generateStructuredAIResponse<any>(
      TEACHER_RECOMMENDATION_PROMPT,
      JSON.stringify({ analysis, insights })
    );

    yield { step: "done", data: recommendations };
  } catch (err: any) {
    console.warn("Teacher AI workflow failed, using fallback:", err.message);

    const fallbackResult = {
      classWeakTopics: [
        { subject: "General", topic: "Overall Performance", classAverage: 65, affectedStudents: ["Multiple students"], recommendation: "AI analysis is temporarily unavailable. Review recent grades manually." }
      ],
      studentsNeedingAttention: [
        { name: "Check manually", className: data.className || "N/A", averageScore: 0, weakSubjects: ["Review needed"], specificGaps: "AI quota temporarily exhausted", suggestedIntervention: "Please try again later or review gradebook directly." }
      ],
      suggestedTeachingActions: [
        { title: "Manual Review Recommended", description: "AI service quota has been temporarily exhausted. Review the gradebook for insights.", priority: "medium", targetGroup: "All classes" }
      ],
      recommendedNextAssessment: [
        { subject: "General", topic: "Review", suggestedType: "Quick Quiz", timeframe: "This week" }
      ]
    };
    yield { step: "done", data: fallbackResult };
  }
}
