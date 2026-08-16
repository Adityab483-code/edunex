import React from "react";
import { Role } from "../types";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Award, 
  Rocket, 
  MessageSquare, 
  Bot, 
  Sparkles, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Settings, 
  HelpCircle, 
  CheckCircle2, 
  BarChart3, 
  Compass, 
  User,
  Shield,
  Layers,
  FileCheck,
  LogOut,
  Cpu,
  Dna
} from "lucide-react";

interface SidebarProps {
  currentRole: Role;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAiAssistant: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onOpenAiAssistant,
  mobileOpen,
  onCloseMobile,
  onLogout
}) => {
  const roleUpper = String(currentRole).toUpperCase();

  const getNavItems = () => {
    if (roleUpper === "STUDENT") {
      return [
        { id: "dashboard", label: "Student Dashboard", icon: LayoutDashboard },
        { id: "learntwin", label: "Student AI Twin", icon: Cpu },
        { id: "courses", label: "Courses & Lessons", icon: BookOpen },
        { id: "assignments", label: "My Assignments", icon: FileText },
        { id: "quizzes", label: "Quizzes & Tests", icon: CheckCircle2 },
        { id: "projects", label: "Team Projects", icon: Rocket },
        { id: "skills", label: "Skill Mastery Matrix", icon: Award },
        { id: "messages", label: "Messages & Reminders", icon: MessageSquare },
        { id: "discussions", label: "Class Discussions", icon: Users },
        { id: "certificates", label: "Earned Certificates", icon: GraduationCap },
        { id: "feedback", label: "Feedback & Complaints", icon: HelpCircle },
        { id: "ai-assistant", label: "AI Solver & Chatbot", icon: Bot },
        { id: "profile", label: "My Profile", icon: User }
      ];
    }

    if (roleUpper === "TEACHER") {
      return [
        { id: "dashboard", label: "Faculty Dashboard", icon: LayoutDashboard },
        { id: "learntwin", label: "Student AI Twins", icon: Cpu },
        { id: "courses", label: "Course Management", icon: BookOpen },
        { id: "students", label: "Student Roster & Grades", icon: Users },
        { id: "assignments", label: "Assignments & Grading", icon: FileText },
        { id: "quizzes", label: "Assessments & Quizzes", icon: CheckCircle2 },
        { id: "projects", label: "Review Team Projects", icon: Rocket },
        { id: "messages", label: "Broadcasts & Messages", icon: MessageSquare },
        { id: "discussions", label: "Discussion", icon: Users },
        { id: "reports", label: "Class Reports & Analytics", icon: BarChart3 },
        { id: "certificates", label: "Certificates Center", icon: GraduationCap },
        { id: "feedback", label: "Help & Feedback", icon: HelpCircle },
        { id: "ai-assistant", label: "AI Quiz & Coursework Builder", icon: Sparkles },
        { id: "profile", label: "Faculty Profile", icon: User }
      ];
    }

    // Admin
    return [
      { id: "dashboard", label: "Admin Overview", icon: LayoutDashboard },
      { id: "users", label: "User Accounts & Approvals", icon: Users },
      { id: "courses", label: "Course Auditing", icon: BookOpen },
      { id: "projects", label: "Project Oversight", icon: Rocket },
      { id: "analytics", label: "System Analytics", icon: TrendingUp },
      { id: "complaints", label: "Feedback & Complaints", icon: HelpCircle },
      { id: "certificates", label: "Certificate Records", icon: GraduationCap },
      { id: "ai-assistant", label: "AI Intelligence & Operations", icon: Sparkles },
      { id: "settings", label: "Platform Settings", icon: Settings },
      { id: "profile", label: "Admin Profile", icon: User }
    ];
  };

  const navItems = getNavItems();

  const getRoleHeader = () => {
    if (roleUpper === "STUDENT") return "🎓 Student Workspace";
    if (roleUpper === "TEACHER") return "👨‍🏫 Faculty Portal";
    return "🛡️ Admin Console";
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Navigation List */}
        <div className="overflow-y-auto space-y-1 pr-1">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {getRoleHeader()}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "ai-assistant") {
                    onOpenAiAssistant();
                  } else {
                    onTabChange(item.id);
                  }
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* AI Prompt Box in Sidebar Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/5 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/60">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Need AI Guidance?</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2.5">
              Ask AI to explain concepts, generate quizzes, or review roadmaps.
            </p>
            <button
              onClick={onOpenAiAssistant}
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              Launch Smart AI
            </button>
          </div>

          {onLogout && (
            <button
              onClick={() => {
                onCloseMobile();
                onLogout();
              }}
              className="w-full mt-2.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
