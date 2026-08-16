import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Role, User, Course, Assignment, Quiz } from "../types";
import { askAiAssistant, createQuizApi, createAssignmentApi } from "../lib/api";
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Lightbulb, 
  FileCheck2, 
  BookOpen, 
  Compass, 
  MessageSquareQuote,
  Loader2,
  Copy,
  Check,
  ListOrdered,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Upload,
  PlusCircle,
  FileText,
  Users,
  ShieldCheck,
  BarChart2,
  ClipboardList,
  AlertCircle,
  Code,
  GraduationCap,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: Role;
  initialMode?: string;
  currentUser?: User;
  users?: User[];
  courses?: Course[];
  assignments?: Assignment[];
  quizzes?: Quiz[];
  complaints?: any[];
  onPublishQuiz?: (quiz: Partial<Quiz>) => Promise<any> | void;
  onPublishAssignment?: (assignment: Partial<Assignment>) => Promise<any> | void;
  onNavigateTab?: (tab: string) => void;
}

interface AssistantMode {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  promptPlaceholder: string;
  quickPrompts: string[];
  roles: ("STUDENT" | "TEACHER" | "ADMIN")[];
}

const ALL_MODES: AssistantMode[] = [
  // --- STUDENT MODES ---
  {
    id: "student-solve",
    name: "Question & Problem Solver",
    badge: "Direct Solution & Proof",
    description: "Input ANY homework, coding, math, or theoretical question -> Get a direct, verified answer with step-by-step logic, code, and sanity check.",
    icon: Code,
    promptPlaceholder: "Paste or type any question (e.g. 'Solve Dijkstra algorithm in TypeScript', 'Derive quadratic formula', 'Debug this React useEffect')...",
    quickPrompts: [
      "Solve: Two Sum problem in TypeScript with O(n) time",
      "Explain and prove why 0.1 + 0.2 !== 0.3 in IEEE 754 float",
      "Fix: React state not updating inside setTimeout closure",
      "Solve: Balance a Binary Search Tree with AVL rotations"
    ],
    roles: ["STUDENT"]
  },
  {
    id: "general-chat",
    name: "AI Tutor & General Chatbot",
    badge: "Conversational Assistant",
    description: "Chat freely on any topic! Ask questions, clarify difficult concepts, request code walkthroughs, or get personalized study advice.",
    icon: Bot,
    promptPlaceholder: "Ask me anything about your studies, code, or technical topics...",
    quickPrompts: [
      "Can you explain how async/await works under the hood?",
      "Give me 3 practice problems on dynamic programming",
      "What is the difference between SQL and NoSQL databases?",
      "How can I prepare effectively for a full-stack technical interview?"
    ],
    roles: ["STUDENT", "TEACHER", "ADMIN"]
  },
  {
    id: "student-explain",
    name: "Deep-Dive Topic Explainer",
    badge: "Systematic Breakdown",
    description: "Comprehensive 6-tier architectural breakdown: Definition → Mechanics → Working Code → Best Practices → Pitfalls → Knowledge Check.",
    icon: ListOrdered,
    promptPlaceholder: "Enter concept (e.g., 'React useEffect lifecycle', 'Database Indexing', 'JWT Authentication')...",
    quickPrompts: [
      "Explain React useEffect lifecycle step-by-step",
      "Break down database indexing and B-Tree mechanics",
      "Explain JWT Authentication flow and token refresh"
    ],
    roles: ["STUDENT"]
  },
  {
    id: "student-hint",
    name: "Socratic Guided Hints",
    badge: "Progressive Scaffolding",
    description: "Receive progressive 3-tier clues without spoiling the final answer: Foundational Principle → Structural Clue → Action Question.",
    icon: Lightbulb,
    promptPlaceholder: "Describe where you are stuck in your code or theory...",
    quickPrompts: [
      "Why is my component re-rendering in an infinite loop?",
      "How do I update an item inside a state array immutably?",
      "Why is my async fetch returning undefined on first render?"
    ],
    roles: ["STUDENT"]
  },
  {
    id: "roadmap-suggest",
    name: "Career & Skill Roadmap",
    badge: "Milestone Architect",
    description: "Detailed chronological 12-week roadmap: Foundations → Frameworks → Cloud & AI → Capstone Portfolio.",
    icon: Compass,
    promptPlaceholder: "Enter career goal (e.g., 'Full-Stack TypeScript Engineer', 'AI Specialist')...",
    quickPrompts: [
      "12-Week Roadmap for Modern Full-Stack Web Developer",
      "Learning path for AI & LLM Application Engineer",
      "Study timeline for Cloud & DevOps Practitioner"
    ],
    roles: ["STUDENT"]
  },

  // --- TEACHER MODES ---
  {
    id: "teacher-quiz-builder",
    name: "Quiz Builder & 1-Click Uploader",
    badge: "Interactive Assessment Engine",
    description: "AI designs complete quizzes with questions, options A-D, verified correct answers, and explanations. 1-Click publish directly into EduNex Quizzes Hub!",
    icon: FileCheck2,
    promptPlaceholder: "Enter quiz subject & difficulty (e.g., 'React State Management, Intermediate, 5 questions')...",
    quickPrompts: [
      "Create a 4-question quiz on React Hooks and Performance Optimization",
      "Generate an intermediate quiz on REST API Security and JWT",
      "Build a diagnostic quiz on SQL Database Normalization"
    ],
    roles: ["TEACHER"]
  },
  {
    id: "teacher-assignment-builder",
    name: "Assignment Builder & Uploader",
    badge: "Coursework Architect",
    description: "Generate structured assignments with learning objectives, starter guidelines, and point rubrics. 1-Click publish directly into Coursework!",
    icon: FileText,
    promptPlaceholder: "Enter assignment topic (e.g., 'Build a Full-Stack Express & SQLite REST API with Auth')...",
    quickPrompts: [
      "Create assignment: Full-Stack Express REST API with SQLite and JWT",
      "Create assignment: React Dashboard with Interactive Charts and Tailwind",
      "Create assignment: Microservice Data Pipeline with Error Handling"
    ],
    roles: ["TEACHER"]
  },
  {
    id: "teacher-chatbot",
    name: "Faculty AI Advisor & Chatbot",
    badge: "Pedagogy & Classroom Helper",
    description: "Consult with AI on teaching strategies, lab demos, tricky student questions, rubric definitions, and lecture preparation.",
    icon: GraduationCap,
    promptPlaceholder: "Ask any teaching or curriculum question...",
    quickPrompts: [
      "How can I teach asynchronous JavaScript promises to beginners effectively?",
      "Design a 15-minute hands-on debugging lab challenge",
      "What are common student misconceptions with React state immutability?",
      "How to balance theoretical lectures with practical coding workshops?"
    ],
    roles: ["TEACHER"]
  },
  {
    id: "teacher-tasks",
    name: "Tasks & Workload Assistant",
    badge: "Faculty Workflow",
    description: "Organize pending coursework grading, draft ready-to-send student announcements, plan weekly milestone schedules, and prioritize tasks.",
    icon: ClipboardList,
    promptPlaceholder: "Enter task planning request (e.g., 'Draft announcement for midterm quiz deadline')...",
    quickPrompts: [
      "Draft an announcement for assignment submission deadline this Friday",
      "Help me prioritize grading 20 student submissions efficiently",
      "Outline weekly curriculum milestones for the remaining month"
    ],
    roles: ["TEACHER"]
  },
  {
    id: "lesson-plan",
    name: "60-Min Lesson Architect",
    badge: "Pedagogical Plan",
    description: "Timed 60-minute agenda: Objectives (Bloom's Taxonomy) → Timeline → Direct Instruction → Guided Lab → Exit Ticket.",
    icon: BookOpen,
    promptPlaceholder: "Enter lesson topic (e.g., 'Async/Await & Error Middleware in Express')...",
    quickPrompts: [
      "60-Minute Lesson on Express REST API Error Handling",
      "Curriculum plan for Responsive Tailwind Layouts",
      "Lesson plan on Web Security & OWASP Top 10"
    ],
    roles: ["TEACHER"]
  },
  {
    id: "feedback-draft",
    name: "Code Review & Feedback Drafter",
    badge: "Rubric Evaluation",
    description: "Draft constructive student feedback: Strengths → Line-by-Line Code Review → Prioritized Improvement Steps.",
    icon: MessageSquareQuote,
    promptPlaceholder: "Paste student submission summary or code snippet...",
    quickPrompts: [
      "Review submission for Express Auth REST API with JWT",
      "Feedback on React Shopping Cart state management",
      "Critique code structure for Async Database Migrations"
    ],
    roles: ["TEACHER"]
  },

  // --- ADMIN MODES ---
  {
    id: "admin-intel",
    name: "Student & Faculty Intelligence",
    badge: "Live System Records",
    description: "Query real-time database intelligence: Registered student rosters, teacher course workloads, enrollment metrics, and system ticket status.",
    icon: Users,
    promptPlaceholder: "Ask about users (e.g., 'Show all registered students and their enrolled courses', 'List faculty members and departments')...",
    quickPrompts: [
      "Show all registered students and their enrolled courses",
      "List all faculty teachers, their departments, and approval status",
      "Give me an executive summary of course completions and active complaints",
      "Which courses have the highest student enrollment?"
    ],
    roles: ["ADMIN"]
  },
  {
    id: "admin-chat",
    name: "Admin Operations Chatbot",
    badge: "Institutional Governance",
    description: "Platform governance advisor: Accreditation criteria, server architecture, policy compliance, student retention strategies, and dispute resolution.",
    icon: ShieldCheck,
    promptPlaceholder: "Ask any administrative, governance, or policy question...",
    quickPrompts: [
      "What are best practices for resolving student grade disputes?",
      "How to increase student course completion rates across the platform?",
      "Create an institutional policy for AI usage in coding assignments",
      "Checklist for server backup and database integrity audits"
    ],
    roles: ["ADMIN"]
  },
  {
    id: "admin-analytics",
    name: "Analytics & Health Advisor",
    badge: "Institutional Metrics",
    description: "Strategic insights on student engagement, drop-out prevention recommendations, course popularity, and platform performance.",
    icon: BarChart2,
    promptPlaceholder: "Request institutional analytics and optimization recommendations...",
    quickPrompts: [
      "Analyze student retention risks and suggest interventions",
      "How can we optimize course distribution across departments?",
      "Provide an executive report on platform activity and teacher approvals"
    ],
    roles: ["ADMIN"]
  }
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  userRole = "STUDENT",
  initialMode,
  currentUser,
  users = [],
  courses = [],
  assignments = [],
  quizzes = [],
  complaints = [],
  onPublishQuiz,
  onPublishAssignment,
  onNavigateTab
}) => {
  const roleUpper = (String(userRole).toUpperCase()) as "STUDENT" | "TEACHER" | "ADMIN";
  const isTeacher = roleUpper === "TEACHER";
  const isAdmin = roleUpper === "ADMIN";

  // Filter modes applicable to the current role
  const availableModes = ALL_MODES.filter(m => m.roles.includes(roleUpper));

  const getInitialModeId = () => {
    if (initialMode) {
      const matched = availableModes.find(m => m.id === initialMode);
      if (matched) return matched.id;
      if (initialMode === "socratic" || initialMode === "student-hint") return "student-hint";
      if (initialMode === "lesson" || initialMode === "lesson-plan") return "lesson-plan";
      if (initialMode === "quiz" || initialMode === "quiz-gen" || initialMode === "quiz-builder") return isTeacher ? "teacher-quiz-builder" : "general-chat";
      if (initialMode === "assignment" || initialMode === "assignment-builder") return "teacher-assignment-builder";
      if (initialMode === "solve" || initialMode === "student-solve") return "student-solve";
      if (initialMode === "roadmap" || initialMode === "roadmap-suggest") return "roadmap-suggest";
      if (initialMode === "intel" || initialMode === "admin-intel") return "admin-intel";
    }
    if (isAdmin) return "admin-intel";
    if (isTeacher) return "teacher-quiz-builder";
    return "student-solve";
  };

  const [activeModeId, setActiveModeId] = useState<string>(getInitialModeId());
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [publishedQuizzes, setPublishedQuizzes] = useState<Record<string, boolean>>({});
  const [publishedAssignments, setPublishedAssignments] = useState<Record<string, boolean>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeMode = availableModes.find(m => m.id === activeModeId) || availableModes[0] || ALL_MODES[0];

  const getWelcomeGreeting = () => {
    if (isAdmin) {
      return `## 🛡️ Welcome Administrator! EduNex System AI is ready.

I provide **real-time intelligence on students and teachers**, as well as operational platform guidance:
1. **Live Student & Faculty Records:** Ask me to list students, check enrollments, or review faculty workloads.
2. **Operations & Governance Chatbot:** Ask policy, accreditation, compliance, or system health questions.
3. **Institutional Analytics:** Get strategic recommendations on retention and course popularity.

*Choose a mode above or click a prompt below to begin.*`;
    }

    if (isTeacher) {
      return `## 👨‍🏫 Welcome Professor! EduNex Faculty Assistant & Curriculum Engine is ready.

I am your comprehensive teaching assistant. Choose a mode above to:
1. **Interactive Quiz Builder:** Generate complete quizzes and **publish directly to the app with 1-click**!
2. **Assignment Builder:** Create structured coursework with rubrics and **publish directly to students**!
3. **Faculty AI Advisor & Chatbot:** Ask questions about tricky topics, lab demos, or student engagement.
4. **Task & Workload Assistant:** Plan grading schedules, draft student announcements, and prioritize tasks.

*Select a quick prompt below or type your topic to get started.*`;
    }

    return `## 🎓 Welcome Learner! EduNex AI Problem Solver & Study Buddy is ready.

I can **solve any question** and guide you through your entire curriculum:
1. ⚡ **Direct Question Solver:** Paste or ask ANY question (code, math, algorithms, theory) to get a full, verified solution with code and step-by-step proof!
2. 🤖 **General AI Chatbot:** Ask anything! Explain concepts, clear doubts, debug bugs, or get study advice.
3. 💡 **Socratic Tutor:** Step-by-step progressive clues when you want to solve it yourself.
4. 🗺️ **Career Roadmaps:** 12-week progression paths for full-stack and AI engineering.

*Type your question below or click a quick suggestion!*`;
  };

  const [chatHistory, setChatHistory] = useState<{
    role: "user" | "ai";
    text: string;
    modeId?: string;
    timestamp: string;
    parsedQuiz?: Partial<Quiz> | null;
    parsedAssignment?: Partial<Assignment> | null;
  }[]>([
    {
      role: "ai",
      text: getWelcomeGreeting(),
      timestamp: "Just now"
    }
  ]);

  // Sync mode if initialMode prop changes
  useEffect(() => {
    if (initialMode) {
      setActiveModeId(getInitialModeId());
    }
  }, [initialMode]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, loading, isOpen]);

  if (!isOpen) return null;

  // Parser helper to extract embedded JSON blocks for quizzes and assignments
  const extractStructuredData = (text: string) => {
    let parsedQuiz: Partial<Quiz> | null = null;
    let parsedAssignment: Partial<Assignment> | null = null;

    // Check for ```quiz-json ... ```
    const quizMatch = text.match(/```quiz-json\s*([\s\S]*?)\s*```/);
    if (quizMatch && quizMatch[1]) {
      try {
        const json = JSON.parse(quizMatch[1].trim());
        if (json.questions && Array.isArray(json.questions)) {
          parsedQuiz = {
            id: `q-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            courseId: courses[0]?.id || "c-1",
            courseTitle: json.courseTitle || courses[0]?.title || "General Curriculum",
            title: json.title || "AI Generated Quiz",
            difficulty: json.difficulty || "Intermediate",
            timeLimitMinutes: json.timeLimitMinutes || 15,
            description: json.description || "Interactive assessment created via EduNex AI Assistant.",
            type: "teacher_uploaded",
            instructorId: currentUser?.id || "teacher-1",
            instructorName: currentUser?.name || "Faculty Instructor",
            instructorAvatar: currentUser?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100",
            totalPoints: json.questions.length * 10,
            tags: ["AI Generated", json.difficulty || "Intermediate"],
            questions: json.questions.map((q: any, i: number) => ({
              id: `q-item-${Date.now()}-${i}`,
              question: q.question,
              options: q.options || ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
              explanation: q.explanation || "Correct concept application.",
              topic: q.topic || "Core Knowledge"
            }))
          };
        }
      } catch (e) {
        console.warn("Could not parse quiz-json payload:", e);
      }
    }

    // Check for ```assignment-json ... ```
    const assignmentMatch = text.match(/```assignment-json\s*([\s\S]*?)\s*```/);
    if (assignmentMatch && assignmentMatch[1]) {
      try {
        const json = JSON.parse(assignmentMatch[1].trim());
        if (json.title) {
          parsedAssignment = {
            id: `asg-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            courseId: courses[0]?.id || "c-1",
            courseTitle: json.courseTitle || courses[0]?.title || "General Curriculum",
            title: json.title,
            description: json.description || "",
            totalPoints: json.totalPoints || 100,
            deadline: json.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            status: "PENDING",
            submissions: [],
            instructorId: currentUser?.id || "teacher-1",
            instructorName: currentUser?.name || "Faculty Instructor",
            createdAt: new Date().toISOString()
          };
        }
      } catch (e) {
        console.warn("Could not parse assignment-json payload:", e);
      }
    }

    return { parsedQuiz, parsedAssignment };
  };

  const handleSend = async (customPrompt?: string, customModeId?: string) => {
    const textToSend = (customPrompt || prompt).trim();
    const modeToUse = customModeId || activeModeId;

    if (!textToSend || loading) return;

    const userMessage = {
      role: "user" as const,
      text: textToSend,
      modeId: modeToUse,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatHistory(prev => [...prev, userMessage]);
    if (!customPrompt) setPrompt("");
    setLoading(true);

    try {
      // Build lightweight context data
      const contextData = {
        studentCount: users.filter(u => String(u.role).toUpperCase() === "STUDENT").length,
        teacherCount: users.filter(u => String(u.role).toUpperCase() === "TEACHER").length,
        courses: courses.map(c => ({ id: c.id, title: c.title, category: c.category, enrolled: c.enrolledCount })),
        activeUser: currentUser?.name
      };

      const replyText = await askAiAssistant(textToSend, modeToUse, roleUpper, contextData);
      const { parsedQuiz, parsedAssignment } = extractStructuredData(replyText);

      // Clean up json blocks from visible markdown if needed or leave formatted
      setChatHistory(prev => [
        ...prev,
        {
          role: "ai",
          text: replyText,
          modeId: modeToUse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          parsedQuiz,
          parsedAssignment
        }
      ]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          role: "ai",
          text: "### ⚠️ System Notice\nI encountered a transient network issue. Please verify your connection or try submitting your question again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishQuiz = async (quiz: Partial<Quiz>, msgIdx: number) => {
    if (!quiz) return;
    try {
      if (onPublishQuiz) {
        await onPublishQuiz(quiz);
      } else {
        await createQuizApi(quiz);
      }
      setPublishedQuizzes(prev => ({ ...prev, [`quiz-${msgIdx}`]: true }));
    } catch (err) {
      console.error("Failed to publish quiz:", err);
      alert("Failed to publish quiz. Please check server logs.");
    }
  };

  const handlePublishAssignment = async (assignment: Partial<Assignment>, msgIdx: number) => {
    if (!assignment) return;
    try {
      if (onPublishAssignment) {
        await onPublishAssignment(assignment);
      } else {
        await createAssignmentApi(assignment);
      }
      setPublishedAssignments(prev => ({ ...prev, [`asg-${msgIdx}`]: true }));
    } catch (err) {
      console.error("Failed to publish assignment:", err);
      alert("Failed to publish assignment. Please check server logs.");
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    // Strip raw json tags for cleaner copied notes
    const cleanedText = text.replace(/```(quiz-json|assignment-json)[\s\S]*?```/g, "").trim();
    navigator.clipboard.writeText(cleanedText || text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setChatHistory([
      {
        role: "ai",
        text: `## 🔄 Chat Reset\n\nReady for a new question or curriculum design inquiry. Current Mode: **${activeMode.name}**.`,
        timestamp: "Just now"
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 text-white flex items-center justify-between ${
          isAdmin 
            ? "bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900" 
            : isTeacher 
            ? "bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900" 
            : "bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  {isAdmin 
                    ? "EduNex AI Admin Intelligence & Operations" 
                    : isTeacher 
                    ? "EduNex Faculty AI & Quiz/Assignment Builder" 
                    : "EduNex AI Problem Solver & Study Assistant"}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/20 text-amber-200 uppercase tracking-wider">
                  {roleUpper}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/90 hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Gemini API
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                {isAdmin
                  ? "Live student & faculty lookup, institutional analytics, platform governance, and general chatbot."
                  : isTeacher
                  ? "Build quizzes and assignments with 1-click publish, faculty general chatbot, and task assistant."
                  : "Solve any problem with direct solutions, general chatbot for all questions, and topic explanations."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              title="Reset conversation"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {availableModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = activeModeId === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveModeId(mode.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
                  <span>{mode.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Mode Description Banner */}
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-[11px] text-indigo-900 dark:text-indigo-200">
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">[{activeMode.badge}]</span>
              <span>{activeMode.description}</span>
            </span>
          </div>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className={`w-9 h-9 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-sm mt-1 ${
                  isAdmin 
                    ? "bg-slate-900" 
                    : isTeacher 
                    ? "bg-purple-600" 
                    : "bg-indigo-600"
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-xs"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-800"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                ) : (
                  <div className="space-y-4">
                    {/* Markdown Output */}
                    <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none space-y-3">
                      <div className="markdown-body space-y-3 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-indigo-700 [&_h2]:dark:text-indigo-300 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:dark:border-slate-800 [&_h2]:pb-1.5 [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:dark:text-white [&_h3]:mt-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:leading-relaxed [&_strong]:text-slate-900 [&_strong]:dark:text-white [&_strong]:font-bold [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-2xl [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-indigo-600 [&_code]:dark:text-indigo-400 [&_code]:font-mono [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:p-0 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-slate-400 [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:dark:border-slate-700 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-slate-700 [&_td]:p-2">
                        <Markdown>{msg.text.replace(/```(quiz-json|assignment-json)[\s\S]*?```/g, "").trim()}</Markdown>
                      </div>
                    </div>

                    {/* Interactive Quiz Preview & 1-Click Publish Card */}
                    {msg.parsedQuiz && (
                      <div className="mt-4 p-4 rounded-2xl border-2 border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {msg.parsedQuiz.title}
                              </h4>
                              <p className="text-[11px] text-purple-700 dark:text-purple-300">
                                {msg.parsedQuiz.questions?.length || 0} Questions • {msg.parsedQuiz.difficulty} • {msg.parsedQuiz.timeLimitMinutes} Mins
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-[10px] font-extrabold">
                            Ready to Publish
                          </span>
                        </div>

                        {/* Expandable Questions Preview */}
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setExpandedCards(prev => ({ ...prev, [`q-${idx}`]: !prev[`q-${idx}`] }))}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                          >
                            {expandedCards[`q-${idx}`] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{expandedCards[`q-${idx}`] ? "Hide Assessment Questions" : "Preview Assessment Questions"}</span>
                          </button>

                          {expandedCards[`q-${idx}`] && (
                            <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                              {msg.parsedQuiz.questions?.map((q, qIndex) => (
                                <div key={q.id || qIndex} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900 text-xs">
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    Q{qIndex + 1}: {q.question}
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                                    {q.options.map((opt, optIndex) => (
                                      <div 
                                        key={optIndex} 
                                        className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                                          optIndex === q.correctAnswer 
                                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 font-bold" 
                                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + optIndex)}) {opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Publish Action Button */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                          {publishedQuizzes[`quiz-${idx}`] ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Published & Live in EduNex Quizzes!</span>
                              {onNavigateTab && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onNavigateTab("quizzes");
                                    onClose();
                                  }}
                                  className="ml-2 px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all"
                                >
                                  Open Quizzes Hub
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePublishQuiz(msg.parsedQuiz!, idx)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>🚀 Save & Publish Quiz to App</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interactive Assignment Preview & 1-Click Publish Card */}
                    {msg.parsedAssignment && (
                      <div className="mt-4 p-4 rounded-2xl border-2 border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {msg.parsedAssignment.title}
                              </h4>
                              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                                {msg.parsedAssignment.courseTitle} • {msg.parsedAssignment.totalPoints} Total Points • Due {msg.parsedAssignment.deadline}
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-extrabold">
                            Coursework Spec
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {msg.parsedAssignment.description}
                        </p>

                        {/* Publish Action Button */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                          {publishedAssignments[`asg-${idx}`] ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Published & Live in Coursework!</span>
                              {onNavigateTab && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onNavigateTab("assignments");
                                    onClose();
                                  }}
                                  className="ml-2 px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all"
                                >
                                  Open Coursework
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePublishAssignment(msg.parsedAssignment!, idx)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>📤 Save & Publish Assignment to App</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Metadata & Copy */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {isAdmin 
                          ? "Live Platform Intelligence" 
                          : isTeacher 
                          ? "Faculty Curriculum Engine" 
                          : "Verified Solution & Logic"}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.text, idx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold transition-all flex items-center gap-1"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Response
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="font-semibold">
                  {activeModeId === "student-solve"
                    ? "Solving question directly with step-by-step logic & code..."
                    : activeModeId === "teacher-quiz-builder"
                    ? "Designing interactive assessment & options..."
                    : activeModeId === "teacher-assignment-builder"
                    ? "Structuring coursework spec and rubric..."
                    : activeModeId === "admin-intel"
                    ? "Analyzing live student and faculty database records..."
                    : "Formulating thorough, intelligent response..."}
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 text-[10px]">
            Suggestions:
          </span>
          {activeMode.quickPrompts.map((qp, qIdx) => (
            <button
              key={qIdx}
              type="button"
              onClick={() => handleSend(qp)}
              disabled={loading}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all whitespace-nowrap shrink-0 font-medium"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeMode.promptPlaceholder}
              disabled={loading}
              className="flex-1 bg-transparent px-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 shrink-0"
            >
              <span>{activeModeId === "student-solve" ? "Solve" : activeModeId.includes("builder") ? "Generate" : "Ask"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
              Directly powered by Google Gemini API
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-400">
              Press Enter or click to submit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
