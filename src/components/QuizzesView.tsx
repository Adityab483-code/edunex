import React, { useState, useEffect } from "react";
import { Quiz, QuizQuestion, Role, User, Course } from "../types";
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  X, 
  Plus, 
  Award, 
  RotateCcw,
  Check,
  Brain,
  Trash2,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  Filter,
  CheckSquare,
  Zap,
  Layers,
  FileQuestion,
  Lightbulb,
  AlertCircle,
  Cpu
} from "lucide-react";
import confetti from "canvas-confetti";
import { generateAiQuizApi } from "../lib/api";

interface QuizzesViewProps {
  quizzes: Quiz[];
  courses?: Course[];
  currentUser: User | null;
  userRole: Role;
  initialQuizId?: string;
  onNavigateTab?: (tab: string) => void;
  onSubmitQuiz: (quizId: string, answers: Record<string, number>) => Promise<any>;
  onCreateQuiz: (quiz: Partial<Quiz>) => void;
  onDeleteQuiz?: (quizId: string) => void;
  onOpenAiAssistant: () => void;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  quizzes,
  courses = [],
  currentUser,
  userRole,
  initialQuizId,
  onNavigateTab,
  onSubmitQuiz,
  onCreateQuiz,
  onDeleteQuiz,
  onOpenAiAssistant
}) => {
  const isStudent = String(userRole).toUpperCase() === "STUDENT";
  const isTeacher = String(userRole).toUpperCase() === "TEACHER";
  const isAdmin = String(userRole).toUpperCase() === "ADMIN";

  // Section Filter: "all" | "ai" | "teacher"
  const [activeFilter, setActiveFilter] = useState<"all" | "ai" | "teacher">("all");

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [attemptResult, setAttemptResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Auto-launch quiz when redirected with initialQuizId
  useEffect(() => {
    if (initialQuizId && quizzes.length > 0) {
      const match = quizzes.find(q => 
        q.id === initialQuizId || 
        q.courseId === initialQuizId ||
        q.title.toLowerCase() === initialQuizId.toLowerCase() ||
        (q.courseTitle && q.courseTitle.toLowerCase() === initialQuizId.toLowerCase())
      );
      if (match) {
        setActiveQuiz(match);
        setSelectedAnswers({});
        setAttemptResult(null);
        setActiveQuestionIdx(0);
      }
    }
  }, [initialQuizId, quizzes]);

  // Socratic Hint Modal
  const [hintModalQuestion, setHintModalQuestion] = useState<QuizQuestion | null>(null);

  // AI Assistant Quiz Generator Controls (Student Section)
  const [generatingAiQuiz, setGeneratingAiQuiz] = useState(false);
  const [aiTopic, setAiTopic] = useState("Full-Stack Web Development");
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [aiQuestionCount, setAiQuestionCount] = useState<6 | 7>(7); // strictly 6 or 7 questions

  // Teacher Upload Quiz Modal (Teacher Only)
  const [showTeacherUploadModal, setShowTeacherUploadModal] = useState(false);
  const [teacherCourseId, setTeacherCourseId] = useState(courses[0]?.id || "c-1");
  const [teacherCourseTitle, setTeacherCourseTitle] = useState(courses[0]?.title || "Modern Full-Stack Web Development");
  const [teacherQuizTitle, setTeacherQuizTitle] = useState("");
  const [teacherQuizDesc, setTeacherQuizDesc] = useState("");
  const [teacherTimeLimit, setTeacherTimeLimit] = useState(15);
  const [teacherDifficulty, setTeacherDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [teacherQuestions, setTeacherQuestions] = useState<QuizQuestion[]>([
    {
      id: "t-q-1",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      topic: "General Concept"
    }
  ]);
  const [aiPopulatingTeacherDraft, setAiPopulatingTeacherDraft] = useState(false);

  // Admin Delete Confirmation Modal (Admin Only)
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  // Synchronize default course title when courseId changes in teacher modal
  useEffect(() => {
    if (courses.length > 0) {
      const selected = courses.find(c => c.id === teacherCourseId);
      if (selected) {
        setTeacherCourseTitle(selected.title);
      }
    }
  }, [teacherCourseId, courses]);

  // Handle AI Quiz Generation for Student (strictly 6 to 7 questions)
  const handleGenerateStudentAiQuiz = async () => {
    const chosenTopic = customTopicInput.trim() || aiTopic;
    setGeneratingAiQuiz(true);
    try {
      const generated = await generateAiQuizApi({
        topic: chosenTopic,
        difficulty: aiDifficulty,
        questionCount: aiQuestionCount, // strictly 6 or 7
        courseTitle: `${chosenTopic} AI Practice`
      });

      if (generated && generated.questions && generated.questions.length > 0) {
        // Enforce strictly 6 to 7 questions
        const slicedQuestions = generated.questions.slice(0, aiQuestionCount);
        const finalQuiz: Quiz = {
          ...generated,
          questions: slicedQuestions,
          type: "ai_generated",
          instructorName: "EduNex AI Mentor"
        };
        // Auto-save into quizzes state
        onCreateQuiz(finalQuiz);
        // Immediately start the quiz
        setActiveQuiz(finalQuiz);
        setSelectedAnswers({});
        setAttemptResult(null);
        setActiveQuestionIdx(0);
      }
    } catch (err) {
      console.error("AI quiz generation error:", err);
      alert("Failed to generate AI quiz. Please try again.");
    } finally {
      setGeneratingAiQuiz(false);
    }
  };

  // Populate Teacher Quiz Builder with AI draft
  const handleAiDraftForTeacher = async () => {
    if (!teacherQuizTitle.trim()) {
      alert("Please enter a Quiz Title first so the AI can tailor the questions!");
      return;
    }
    setAiPopulatingTeacherDraft(true);
    try {
      const draft = await generateAiQuizApi({
        topic: `${teacherCourseTitle}: ${teacherQuizTitle}`,
        difficulty: teacherDifficulty,
        questionCount: 6, // clean 6-question draft for teacher
        courseTitle: teacherCourseTitle
      });

      if (draft && draft.questions && draft.questions.length > 0) {
        setTeacherQuestions(draft.questions);
        if (!teacherQuizDesc) {
          setTeacherQuizDesc(`Official curriculum assessment covering ${teacherQuizTitle}.`);
        }
      }
    } catch (err) {
      console.error("Failed to generate teacher draft:", err);
    } finally {
      setAiPopulatingTeacherDraft(false);
    }
  };

  // Add a blank question to teacher quiz builder
  const handleAddQuestionToTeacherQuiz = () => {
    setTeacherQuestions(prev => [
      ...prev,
      {
        id: `t-q-${Date.now()}-${prev.length + 1}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
        topic: "Topic Concept"
      }
    ]);
  };

  // Update question in teacher quiz builder
  const handleUpdateTeacherQuestion = (idx: number, field: keyof QuizQuestion, value: any) => {
    setTeacherQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Update option in teacher quiz builder
  const handleUpdateTeacherOption = (qIdx: number, optIdx: number, value: string) => {
    setTeacherQuestions(prev => {
      const copy = [...prev];
      const newOpts = [...copy[qIdx].options];
      newOpts[optIdx] = value;
      copy[qIdx] = { ...copy[qIdx], options: newOpts };
      return copy;
    });
  };

  // Remove question from teacher quiz builder
  const handleRemoveTeacherQuestion = (idx: number) => {
    if (teacherQuestions.length <= 1) {
      alert("A quiz must contain at least 1 question.");
      return;
    }
    setTeacherQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Publish Teacher Quiz
  const handlePublishTeacherQuiz = () => {
    if (!teacherQuizTitle.trim()) {
      alert("Please provide a Quiz Title.");
      return;
    }

    // Validate questions
    for (let i = 0; i < teacherQuestions.length; i++) {
      const q = teacherQuestions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is missing question text.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j]?.trim()) {
          alert(`Question ${i + 1} is missing Option ${String.fromCharCode(65 + j)}.`);
          return;
        }
      }
    }

    const newQuiz: Partial<Quiz> = {
      id: `quiz-tch-${Date.now()}`,
      courseId: teacherCourseId,
      courseTitle: teacherCourseTitle,
      title: teacherQuizTitle.trim(),
      description: teacherQuizDesc.trim() || `Course quiz created by ${currentUser?.name || "Instructor"}.`,
      timeLimitMinutes: Number(teacherTimeLimit) || 15,
      type: "teacher_uploaded",
      difficulty: teacherDifficulty,
      instructorId: currentUser?.id,
      instructorName: currentUser?.name || "Teacher",
      instructorAvatar: currentUser?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100",
      createdAt: new Date().toISOString(),
      totalPoints: teacherQuestions.length * 10,
      tags: ["Teacher Uploaded", teacherDifficulty, `${teacherQuestions.length} Questions`],
      questions: teacherQuestions
    };

    onCreateQuiz(newQuiz);
    setShowTeacherUploadModal(false);

    // Reset teacher form
    setTeacherQuizTitle("");
    setTeacherQuizDesc("");
    setTeacherQuestions([
      {
        id: "t-q-1",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
        topic: "General Concept"
      }
    ]);

    alert("Teacher Quiz uploaded and published successfully!");
  };

  // Admin Delete Quiz Confirm
  const handleConfirmAdminDelete = () => {
    if (!quizToDelete) return;
    if (onDeleteQuiz) {
      onDeleteQuiz(quizToDelete.id);
    }
    setQuizToDelete(null);
  };

  // Option selection during quiz taking
  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Submit Active Quiz
  const handleSubmitAttempt = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);

    try {
      const result = await onSubmitQuiz(activeQuiz.id, selectedAnswers);
      setAttemptResult(result);
      if (result.percentage >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error("Submit quiz error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetQuiz = () => {
    setActiveQuiz(null);
    setSelectedAnswers({});
    setAttemptResult(null);
    setActiveQuestionIdx(0);
  };

  // Filter quizzes according to active tab
  const filteredQuizzes = quizzes.filter(q => {
    if (activeFilter === "ai") {
      return q.type === "ai_generated";
    }
    if (activeFilter === "teacher") {
      return q.type === "teacher_uploaded" || !q.type;
    }
    return true;
  });

  const aiQuizzesCount = quizzes.filter(q => q.type === "ai_generated").length;
  const teacherQuizzesCount = quizzes.filter(q => q.type === "teacher_uploaded" || !q.type).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Role Permissions Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Quizzes & Skill Assessments
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Practice with AI-generated 6-7 question challenges or take teacher-uploaded course evaluations.
              </p>
            </div>
          </div>
        </div>

        {/* Teacher Upload Option (Strictly Teacher Only) */}
        <div className="flex items-center gap-2">
          {isTeacher && (
            <button
              onClick={() => setShowTeacherUploadModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Upload Course Quiz
            </button>
          )}

          {isAdmin && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Admin Quiz Removal Enabled
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area (when not currently taking a quiz) */}
      {!activeQuiz && (
        <>
          {/* SECTION 1: AI ASSISTANT QUIZ OPTION (STUDENT SECTION) */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
            {/* Background ambient decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/50 pb-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    AI Assistant Quiz Generator (Strictly 6 to 7 Questions)
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Generate an Adaptive AI Knowledge Challenge
                  </h2>
                  <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
                    Choose your curriculum topic, target difficulty, and test length (6 or 7 questions). EduNex AI dynamically generates high-yield diagnostic questions with instant scoring, Socratic hints, and weak topic remediation.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 bg-indigo-950/80 p-1.5 rounded-2xl border border-indigo-700/50">
                  <span className="text-[11px] font-bold text-indigo-300 px-2">Questions:</span>
                  <button
                    onClick={() => setAiQuestionCount(6)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      aiQuestionCount === 6
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-indigo-300 hover:text-white"
                    }`}
                  >
                    6 Questions
                  </button>
                  <button
                    onClick={() => setAiQuestionCount(7)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      aiQuestionCount === 7
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-indigo-300 hover:text-white"
                    }`}
                  >
                    7 Questions
                  </button>
                </div>
              </div>

              {/* Topic Selectors & Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-indigo-200 block mb-1.5">
                    Select Topic Preset
                  </label>
                  <select
                    value={aiTopic}
                    onChange={(e) => {
                      setAiTopic(e.target.value);
                      setCustomTopicInput("");
                    }}
                    className="w-full p-2.5 rounded-xl bg-indigo-950/90 border border-indigo-700/60 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                    <option value="React 18 Hooks & State Architecture">React 18 Hooks & State Architecture</option>
                    <option value="Node.js, Express & REST API Architecture">Node.js, Express & REST APIs</option>
                    <option value="Data Structures & Big-O Complexity">Data Structures & Algorithms</option>
                    <option value="Database Design, SQL & Normalization">Database Design & SQL</option>
                    <option value="JavaScript Asynchronous Control Flow (Promises & Async/Await)">Async JS & Event Loop</option>
                    <option value="Web Security (JWT, CSRF, XSS Prevention)">Web Security & Auth</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-indigo-200 block mb-1.5">
                    Or Enter Custom Subject
                  </label>
                  <input
                    type="text"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    placeholder="e.g. Next.js App Router, Docker, TypeScript"
                    className="w-full p-2.5 rounded-xl bg-indigo-950/90 border border-indigo-700/60 text-white placeholder:text-indigo-400/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-indigo-200 block mb-1.5">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-indigo-950/90 p-1 rounded-xl border border-indigo-700/60">
                    {(["Beginner", "Intermediate", "Advanced"] as const).map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setAiDifficulty(diff)}
                        className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                          aiDifficulty === diff
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-indigo-300 hover:text-white"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleGenerateStudentAiQuiz}
                    disabled={generatingAiQuiz}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-500 hover:from-amber-400 hover:to-indigo-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingAiQuiz ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        Generating {aiQuestionCount} Questions...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-slate-950 fill-current" />
                        Launch {aiQuestionCount}-Question AI Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section Navigation Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All Quizzes ({quizzes.length})
              </button>

              <button
                onClick={() => setActiveFilter("ai")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === "ai"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                AI Assistant Quizzes ({aiQuizzesCount})
              </button>

              <button
                onClick={() => setActiveFilter("teacher")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === "teacher"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                Teacher-Uploaded Quizzes ({teacherQuizzesCount})
              </button>
            </div>

            <span className="text-xs text-slate-400 dark:text-slate-500">
              Showing {filteredQuizzes.length} assessment{filteredQuizzes.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Quiz Cards Grid */}
          {filteredQuizzes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <FileQuestion className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeFilter === "ai" 
                    ? "No AI Quizzes Generated Yet"
                    : activeFilter === "teacher"
                    ? "No Teacher-Uploaded Quizzes Available"
                    : "No Quizzes Currently Available"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {activeFilter === "ai"
                    ? "Use the AI Assistant generator above to create a customized 6-7 question challenge in seconds!"
                    : activeFilter === "teacher"
                    ? isTeacher
                      ? "As a teacher, click 'Upload Course Quiz' to create and upload assessments for your enrolled students."
                      : "Course instructors will upload official midterm and milestone quizzes here."
                    : "Use the AI Assistant to generate practice quizzes or wait for teacher uploads."}
                </p>
              </div>

              {isTeacher && activeFilter !== "ai" && (
                <button
                  onClick={() => setShowTeacherUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" /> Upload First Teacher Quiz
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => {
                const isAiQuiz = quiz.type === "ai_generated";
                const questionCount = quiz.questions?.length || 0;

                return (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Badge Section */}
                      <div className="flex items-center justify-between gap-2">
                        {isAiQuiz ? (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" /> AI Assistant Quiz ({questionCount} Qs)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-emerald-600" /> Teacher Uploaded
                          </span>
                        )}

                        {quiz.difficulty && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {quiz.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Course and Title */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block truncate">
                          {quiz.courseTitle}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {quiz.title}
                        </h3>
                        {quiz.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {quiz.description}
                          </p>
                        )}
                      </div>

                      {/* Author and Metadata */}
                      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={quiz.instructorAvatar || (isAiQuiz ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100" : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100")}
                            alt={quiz.instructorName || "Instructor"}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="truncate max-w-[120px]">{quiz.instructorName || (isAiQuiz ? "AI Mentor" : "Instructor")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.timeLimitMinutes || questionCount * 2}m</span>
                          <span>•</span>
                          <span>{questionCount} Qs</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {/* Admin Delete Action (Admin Only) */}
                      {isAdmin ? (
                        <button
                          onClick={() => setQuizToDelete(quiz)}
                          title="Admin Only: Remove Quiz"
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete (Admin)</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {quiz.isCompleted ? `Completed (${quiz.score}%)` : "Ready to Start"}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setActiveQuiz(quiz);
                          setSelectedAnswers({});
                          setAttemptResult(null);
                          setActiveQuestionIdx(0);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                      >
                        <span>{quiz.isCompleted ? "Re-take Quiz" : "Start Quiz"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ACTIVE QUIZ TAKING SCREEN */}
      {activeQuiz && !attemptResult && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 max-w-3xl mx-auto animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                  {activeQuiz.courseTitle}
                </span>
                {activeQuiz.type === "ai_generated" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> AI 6-7 Question Diagnostic
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {activeQuiz.title}
              </h2>
            </div>

            <button
              onClick={handleResetQuiz}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Exit Assessment"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress and Question Stepper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>Question {activeQuestionIdx + 1} of {activeQuiz.questions.length}</span>
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <Clock className="w-3.5 h-3.5" /> Time Limit: {activeQuiz.timeLimitMinutes || activeQuiz.questions.length * 2} mins
              </span>
            </div>
            {/* Stepper dots */}
            <div className="flex items-center gap-1.5">
              {activeQuiz.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === activeQuestionIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      isCurrent
                        ? "bg-indigo-600"
                        : isAnswered
                        ? "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Single Question View with Socratic AI Hint */}
          {activeQuiz.questions[activeQuestionIdx] && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {activeQuiz.questions[activeQuestionIdx].topic && (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Topic: {activeQuiz.questions[activeQuestionIdx].topic}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                    {activeQuestionIdx + 1}. {activeQuiz.questions[activeQuestionIdx].question}
                  </h3>
                </div>

                <button
                  onClick={() => setHintModalQuestion(activeQuiz.questions[activeQuestionIdx])}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 shrink-0 hover:bg-amber-100 transition-all shadow-xs"
                  title="Receive a guiding Socratic clue from AI without spoiling the answer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI Socratic Hint
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {activeQuiz.questions[activeQuestionIdx].options.map((opt, optIndex) => {
                  const qId = activeQuiz.questions[activeQuestionIdx].id;
                  const isSelected = selectedAnswers[qId] === optIndex;
                  const letter = String.fromCharCode(65 + optIndex);

                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleOptionSelect(qId, optIndex)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-800"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}>
                          {letter}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
              disabled={activeQuestionIdx === 0}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {activeQuestionIdx < activeQuiz.questions.length - 1 ? (
                <button
                  onClick={() => setActiveQuestionIdx(prev => Math.min(activeQuiz.questions.length - 1, prev + 1))}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmitAttempt}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {submitting ? "Grading Responses..." : "Submit All Responses"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUIZ ATTEMPT SCORE & COMPREHENSIVE QUESTION EXPLANATION BREAKDOWN */}
      {attemptResult && activeQuiz && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-w-3xl mx-auto animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Quiz Completed: {attemptResult.percentage}%
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Score: {attemptResult.score} of {attemptResult.maxScore} questions correct • Earned +{attemptResult.score * 50} Student XP!
            </p>
          </div>

          {/* OFFICIAL CERTIFICATE STATUS BANNER (85% THRESHOLD) */}
          {attemptResult.percentage >= 85 ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-black uppercase tracking-wider">
                      ★ Passed with Honors (≥ 85%)
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    Official Course Certificate Autogenerated!
                  </h3>
                  <p className="text-xs text-emerald-50 leading-relaxed">
                    Congratulations! Because you scored <strong>{attemptResult.percentage}%</strong> (exceeding the 85% requirement), your verified certificate for <strong>"{activeQuiz.courseTitle || activeQuiz.title}"</strong> has been automatically generated and added to your Earned Certificates section.
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={() => onNavigateTab("certificates")}
                    className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition-all flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    View My Earned Certificates 🎓
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Certificate Requirement Notice: 85% Passing Score Required</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                You achieved <strong>{attemptResult.percentage}%</strong>. Course completion certificates are autogenerated for scores of <strong>85% or higher</strong>. Review the question explanations below and retake the quiz to earn your certificate!
              </p>
            </div>
          )}

          {/* AI Weak Topic Diagnosis & Remediation */}
          <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
              <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>EduNex AI Weak Topic Diagnosis & Study Blueprint</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
              {attemptResult.suggestedRevision.map((rev: string, idx: number) => (
                <li key={idx}>{rev}</li>
              ))}
            </ul>
          </div>

          {/* Full Question-by-Question Detailed Review with Explanations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              Detailed Answer Rationale & Question Explanations
            </h3>

            <div className="space-y-3">
              {activeQuiz.questions.map((q, idx) => {
                const chosenOptIdx = selectedAnswers[q.id];
                const isCorrect = chosenOptIdx === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                      isCorrect
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                        : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 font-bold">
                      <div className="text-slate-900 dark:text-white">
                        {idx + 1}. {q.question}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                      }`}>
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-400 block mb-0.5">Your Selected Answer:</span>
                        <span className={isCorrect ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                          {chosenOptIdx !== undefined ? `${String.fromCharCode(65 + chosenOptIdx)}) ${q.options[chosenOptIdx]}` : "No Answer Selected"}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-400 block mb-0.5">Correct Answer:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {String.fromCharCode(65 + q.correctAnswer)}) {q.options[q.correctAnswer]}
                        </span>
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5" /> Conceptual Explanation:
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={handleResetQuiz}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Return to Assessment Hub
            </button>
            <button
              onClick={() => {
                handleResetQuiz();
                onNavigateTab("learntwin:failure_simulator");
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <Cpu className="w-4 h-4 text-slate-950" /> Failure Simulator in AI Twin
            </button>
            <button
              onClick={() => {
                handleResetQuiz();
                handleGenerateStudentAiQuiz();
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Try Fresh AI Challenge
            </button>
          </div>
        </div>
      )}

      {/* SOCRATIC HINT MODAL */}
      {hintModalQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI Socratic Clue
                </h3>
              </div>
              <button
                onClick={() => setHintModalQuestion(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Question: <span className="text-slate-900 dark:text-white">{hintModalQuestion.question}</span>
              </p>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  Guiding Mental Model:
                </div>
                <p>
                  Think carefully about the core purpose of {hintModalQuestion.topic || "this concept"}. Focus on determinism, immutability, and state flow. Ask yourself: which option avoids unexpected side effects and maintains predictable execution?
                </p>
              </div>
            </div>

            <button
              onClick={() => setHintModalQuestion(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition-all"
            >
              Got it, continue question
            </button>
          </div>
        </div>
      )}

      {/* TEACHER CREATE/UPLOAD QUIZ MODAL (STRICTLY TEACHER ONLY) */}
      {showTeacherUploadModal && isTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Upload New Course Quiz
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create curriculum assessments with multiple choice questions and answer keys.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTeacherUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Course
                  </label>
                  <select
                    value={teacherCourseId}
                    onChange={(e) => setTeacherCourseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                    {courses.length === 0 && (
                      <option value="c-1">Modern Full-Stack Web Development</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={teacherTimeLimit}
                    onChange={(e) => setTeacherTimeLimit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={teacherQuizTitle}
                  onChange={(e) => setTeacherQuizTitle(e.target.value)}
                  placeholder="e.g. Midterm Evaluation: Async Middleware & DB Queries"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Instructions
                </label>
                <textarea
                  value={teacherQuizDesc}
                  onChange={(e) => setTeacherQuizDesc(e.target.value)}
                  placeholder="Instructions for students taking this assessment..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* AI Draft Helper Box */}
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    AI Quiz Draft Assistant
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Auto-populate questions based on your Quiz Title and Course subject.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAiDraftForTeacher}
                  disabled={aiPopulatingTeacherDraft}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 disabled:opacity-50"
                >
                  {aiPopulatingTeacherDraft ? "Drafting..." : "Auto-Draft Questions"}
                </button>
              </div>

              {/* Question Editor List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Questions ({teacherQuestions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestionToTeacherQuiz}
                    className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {teacherQuestions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Question #{qIdx + 1}
                      </span>
                      {teacherQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeacherQuestion(qIdx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleUpdateTeacherQuestion(qIdx, "question", e.target.value)}
                      placeholder={`Question ${qIdx + 1} text...`}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />

                    {/* 4 Options */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Options (Mark the radio button for the correct answer):
                      </span>
                      {[0, 1, 2, 3].map(optIdx => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctAnswer === optIdx}
                            onChange={() => handleUpdateTeacherQuestion(qIdx, "correctAnswer", optIdx)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-bold text-slate-400 w-4">
                            {String.fromCharCode(65 + optIdx)}:
                          </span>
                          <input
                            type="text"
                            value={q.options[optIdx] || ""}
                            onChange={(e) => handleUpdateTeacherOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Explanation (Shown to students after submission)
                      </label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => handleUpdateTeacherQuestion(qIdx, "explanation", e.target.value)}
                        placeholder="Reason why this answer is correct..."
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTeacherUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishTeacherQuiz}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Publish & Upload Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DELETE CONFIRMATION MODAL (STRICTLY ADMIN ONLY) */}
      {quizToDelete && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/80 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Remove Quiz (Admin Action)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent removal from the platform
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{quizToDelete.title}"</strong> ({quizToDelete.courseTitle})? This action cannot be undone and will remove the assessment and all student attempts.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setQuizToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdminDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
