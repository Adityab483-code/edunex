import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Role } from "../types";
import { askAiAssistant } from "../lib/api";
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
  CheckCircle2
} from "lucide-react";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: Role;
  initialMode?: string;
}

interface SystematicMode {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  promptPlaceholder: string;
  quickPrompts: string[];
}

const MODES: SystematicMode[] = [
  {
    id: "student-explain",
    name: "Step-by-Step Explainer",
    badge: "Systematic Breakdown",
    description: "Delivers a 6-part sequential breakdown: Definition → Ordered Mechanics → Code → Best Practices → Pitfalls → Knowledge Check.",
    icon: ListOrdered,
    promptPlaceholder: "Enter concept (e.g., 'React useEffect lifecycle', 'SQL Indexing', 'JWT Auth')...",
    quickPrompts: [
      "Explain React useEffect lifecycle step-by-step",
      "Break down database indexing mechanics",
      "Explain JWT Authentication flow chronologically"
    ]
  },
  {
    id: "student-hint",
    name: "3-Tier Socratic Hints",
    badge: "Progressive Scaffolding",
    description: "Provides ordered progressive clues without revealing final answers: Foundational Clue → Structural Scaffold → Action Question.",
    icon: Lightbulb,
    promptPlaceholder: "Describe your bug or concept where you're stuck...",
    quickPrompts: [
      "Why is my component re-rendering in an infinite loop?",
      "How do I update an item inside a state array immutably?",
      "Why is my async fetch returning undefined?"
    ]
  },
  {
    id: "lesson-plan",
    name: "Curriculum & Lesson Builder",
    badge: "Pedagogical Architecture",
    description: "Generates a timed 60-minute agenda: Objectives (Bloom's) → Timeline → Direct Instruction → Guided Lab → Exit Ticket.",
    icon: BookOpen,
    promptPlaceholder: "Enter lesson topic (e.g., 'Async/Await & Error Middleware in Express')...",
    quickPrompts: [
      "60-Minute Lesson on Express REST API Error Handling",
      "Curriculum plan for Responsive Tailwind Layouts",
      "Lesson plan on Web Security & OWASP Top 10"
    ]
  },
  {
    id: "quiz-gen",
    name: "Structured Quiz Suite",
    badge: "Sequential Assessments",
    description: "Produces ordered multiple-choice questions with scenario, options A-D, verified correct answer, and detailed rationale.",
    icon: FileCheck2,
    promptPlaceholder: "Enter assessment subject (e.g., 'React Hooks & State', 'HTTP Protocol')...",
    quickPrompts: [
      "Generate 3 quiz questions on React Hooks & Performance",
      "Assessment suite on Database Normalization",
      "Quiz questions on Cybersecurity XSS & CSRF"
    ]
  },
  {
    id: "roadmap-suggest",
    name: "4-Stage Career Roadmap",
    badge: "Sequential Milestones",
    description: "Maps out a chronological timeline: Phase 1 Foundations → Phase 2 Frameworks → Phase 3 Cloud & AI → Phase 4 Capstone.",
    icon: Compass,
    promptPlaceholder: "Enter career aspiration (e.g., 'Full-Stack TypeScript Engineer', 'AI Specialist')...",
    quickPrompts: [
      "12-Week Roadmap for Modern Full-Stack Web Developer",
      "Learning path for AI & LLM Application Engineer",
      "Study timeline for Cloud & DevOps Practitioner"
    ]
  },
  {
    id: "feedback-draft",
    name: "Rubric-Based Code Review",
    badge: "Structured Evaluation",
    description: "Drafts ordered constructive feedback: Strengths → Line-by-Line Code Analysis → Prioritized Refactoring Steps.",
    icon: MessageSquareQuote,
    promptPlaceholder: "Paste student submission summary or code snippet...",
    quickPrompts: [
      "Review submission for Express Auth REST API with JWT",
      "Feedback on React Shopping Cart state management",
      "Critique code structure for Async Database Migrations"
    ]
  }
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  userRole = "STUDENT",
  initialMode
}) => {
  const roleUpper = String(userRole).toUpperCase();
  const isTeacher = roleUpper === "TEACHER";

  const getInitialModeId = () => {
    if (initialMode) {
      if (initialMode === "socratic" || initialMode === "student-hint") return "student-hint";
      if (initialMode === "lesson" || initialMode === "lesson-plan") return "lesson-plan";
      if (initialMode === "quiz" || initialMode === "quiz-gen") return "quiz-gen";
      if (initialMode === "roadmap" || initialMode === "roadmap-suggest") return "roadmap-suggest";
      return initialMode;
    }
    return isTeacher ? "lesson-plan" : "student-explain";
  };

  const [activeModeId, setActiveModeId] = useState<string>(getInitialModeId());
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeMode = MODES.find(m => m.id === activeModeId) || MODES[0];

  const [chatHistory, setChatHistory] = useState<{
    role: "user" | "ai";
    text: string;
    modeId?: string;
    timestamp: string;
  }[]>([
    {
      role: "ai",
      text: isTeacher
        ? `## 🎓 Welcome Professor! EduNex Systematic Assistant is ready.

I specialize in **orderly, step-by-step educational architecture**. Choose a mode above to generate:
1. **60-Minute Lesson Plans** with Bloom's Taxonomy objectives & minute-by-minute agendas.
2. **Structured Quiz Suites** complete with detailed step-by-step rationales.
3. **Rubric-Based Code Reviews** with prioritized refactoring steps.

*Select a quick prompt below or type your lesson topic to begin.*`
        : `## 🚀 Hello Learner! EduNex Systematic Mentor is ready.

I provide **structured, ordered learning guidance** formatted for maximum clarity:
1. **Step-by-Step Concept Breakdowns** with mechanics, code, best practices, and pitfalls.
2. **3-Tier Progressive Socratic Hints** to help you debug without spoiling solutions.
3. **Chronological Milestone Roadmaps** for mastering full-stack and AI skills.

*Select a mode above or click a prompt below to get started!*`,
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
      const replyText = await askAiAssistant(textToSend, modeToUse);
      setChatHistory(prev => [
        ...prev,
        {
          role: "ai",
          text: replyText,
          modeId: modeToUse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          role: "ai",
          text: "### ⚠️ System Notice\nI encountered a transient network issue. Please verify your connection or try submitting your prompt again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setChatHistory([
      {
        role: "ai",
        text: `## 🔄 Chat Reset\n\nReady for a new systematic inquiry. Current Mode: **${activeMode.name}**.`,
        timestamp: "Just now"
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">EduNex Systematic AI Assistant</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/20 text-amber-200 uppercase tracking-wider">
                  Ordered Mode
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Structured explanations, progressive Socratic scaffolding, and chronological pedagogical plans.
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

        {/* Systematic Mode Switcher Tabs */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MODES.map((mode) => {
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
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-xs"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-800"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                ) : (
                  <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none space-y-3">
                    <div className="markdown-body space-y-3 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-indigo-700 [&_h2]:dark:text-indigo-300 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:dark:border-slate-800 [&_h2]:pb-1.5 [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:dark:text-white [&_h3]:mt-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:leading-relaxed [&_strong]:text-slate-900 [&_strong]:dark:text-white [&_strong]:font-bold [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-2xl [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-indigo-600 [&_code]:dark:text-indigo-400 [&_code]:font-mono [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:p-0 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-slate-400">
                      <Markdown>{msg.text}</Markdown>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Systematic Sequential Response
                      </span>
                      
                      <button
                        onClick={() => copyToClipboard(msg.text, idx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold transition-all flex items-center gap-1"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Breakdown
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
                <span className="font-semibold">Structuring ordered response step-by-step...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 text-[10px]">
            Ordered Prompts:
          </span>
          {activeMode.quickPrompts.map((qp, qIdx) => (
            <button
              key={qIdx}
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
              <span>Submit</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
