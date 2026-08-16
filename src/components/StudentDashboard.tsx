import React from "react";
import { User, Course, Assignment, Quiz, StudentSkill, ChatMessage, Certificate } from "../types";
import { getStoredLearningTwin } from "../lib/api";
import { EduNexLogoMark } from "./EduNexLogo";
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Clock, 
  ChevronRight, 
  Target, 
  TrendingUp, 
  GraduationCap, 
  Calendar,
  MessageSquare,
  PlayCircle,
  Cpu,
  ShieldAlert,
  Dna,
  Brain,
  Compass,
  Zap
} from "lucide-react";

interface StudentDashboardProps {
  currentUser: User;
  courses: Course[];
  assignments: Assignment[];
  quizzes: Quiz[];
  skills: StudentSkill[];
  messages: ChatMessage[];
  certificates: Certificate[];
  onNavigateTab: (tab: string) => void;
  onOpenAiAssistant: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  courses = [],
  assignments = [],
  quizzes = [],
  skills = [],
  messages = [],
  certificates = [],
  onNavigateTab,
  onOpenAiAssistant
}) => {
  const enrolled = (courses || []).filter(c => currentUser?.enrolledCourseIds?.includes(c.id));
  const recentMessages = (messages || []).slice(0, 3);
  const pendingAssignments = (assignments || []).filter(a => 
    !(a.submissions || []).some(s => s.studentId === currentUser?.id)
  );

  const twin = getStoredLearningTwin(currentUser.id, currentUser.name, currentUser.avatar);
  const topRisk = twin.predicted_risks[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/10">
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <EduNexLogoMark size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized AI Learning Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name}! 👋
            </h1>
            <p className="text-sm text-indigo-100 max-w-xl">
              Track course progress, collaborate on team projects, and verify your skills with AI guidance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigateTab("courses")}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-slate-100 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Explore Courses
            </button>
            <button
              onClick={onOpenAiAssistant}
              className="px-4 py-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 text-white border border-white/20 font-bold text-xs backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              Gemini AI Solver & Chatbot
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Enrolled Courses</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{enrolled.length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Completed Quizzes</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{(quizzes || []).filter(q => q.isCompleted).length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pending Tasks</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{pendingAssignments.length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Certificates</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{(certificates || []).length}</p>
          </div>
        </div>
      </div>

      {/* LearnTwin Cognitive Snapshot & Future Failure Risk Alert */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                LearnTwin™ Active Cognitive Model
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  Object.keys(twin.concept_mastery).length > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {Object.keys(twin.concept_mastery).length > 0 ? 'Live Telemetry' : 'Calibrating'}
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80">
                {Object.keys(twin.concept_mastery).length > 0
                  ? 'Tracking reasoning depth, knowledge transfer, and retention from your completed assessments.'
                  : 'Cognitive twin automatically builds in real-time as you complete course lessons and quizzes.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("learntwin")}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Open Student AI Twin</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cognitive Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] text-indigo-300 uppercase font-bold flex items-center gap-1">
              <Brain className="w-3 h-3 text-indigo-400" /> Reasoning Score
            </span>
            <p className="text-lg font-black text-white">
              {Object.keys(twin.concept_mastery).length > 0 ? `${twin.reasoning_score}/100` : '--/100'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] text-indigo-300 uppercase font-bold flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" /> Concept Transfer
            </span>
            <p className="text-lg font-black text-white">
              {Object.keys(twin.concept_mastery).length > 0 ? `${twin.concept_transfer_score}/100` : '--/100'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] text-indigo-300 uppercase font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-400" /> Retention Curve
            </span>
            <p className="text-lg font-black text-white">
              {Object.keys(twin.concept_mastery).length > 0 ? `${twin.retention_score}/100` : '--/100'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] text-indigo-300 uppercase font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" /> Top Failure Risk
            </span>
            <p className="text-sm font-black text-amber-300 truncate">
              {topRisk ? `${topRisk.concept} (${topRisk.riskScore}%)` : (Object.keys(twin.concept_mastery).length > 0 ? "No Gaps Detected" : "Awaiting Data")}
            </p>
          </div>
        </div>

        {/* Highlighted Future Failure Alert */}
        {topRisk && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-200">Future Risk Alert: {topRisk.concept} (Risk: {topRisk.riskScore}%)</strong>
                <p className="text-indigo-100 text-[11px] mt-0.5">{topRisk.reason}</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab("learntwin:failure_simulator")}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] shadow-sm transition-all whitespace-nowrap"
            >
              Simulate Failure Scenario
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Enrolled Courses & Learning Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrolled Courses Progress */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Enrolled Courses & Progress
              </h2>
              <button
                onClick={() => onNavigateTab("courses")}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View Catalog <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {enrolled.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">You haven't enrolled in any courses yet.</p>
                  <button
                    onClick={() => onNavigateTab("courses")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    Browse Course Catalog
                  </button>
                </div>
              ) : (
                enrolled.map((course) => {
                  const lessonsList = course.lessons || [];
                  const completedLessons = lessonsList.filter(l => l.completed).length;
                  const totalLessons = lessonsList.length || course.lessonsCount || 1;
                  const percent = Math.round((completedLessons / totalLessons) * 100);

                  return (
                    <div key={course.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={course.thumbnail} alt={course.title} className="w-12 h-12 rounded-xl object-cover" />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{course.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Instructor: {course.instructorName}</p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                          {percent}% Done
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-dual-gradient h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>{completedLessons} of {totalLessons} modules completed</span>
                        <button
                          onClick={() => onNavigateTab("courses")}
                          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Continue
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Skill Radar / Progress Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" /> Skill Competency Breakdown
              </h2>
              <button
                onClick={() => onNavigateTab("skills")}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Full Skill Profile <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {skills.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                No skill metrics recorded yet. Complete quizzes and assignments to build your competency score.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.slice(0, 4).map((sk) => (
                  <div key={sk.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-800 dark:text-slate-200">{sk.name}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{sk.level}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
                        style={{ width: `${sk.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Personal Goals & AI Recommendation */}
        <div className="space-y-6">
          {/* AI Assistant Quiz & Knowledge Assessment Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 border border-indigo-700/50 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" /> 6-7 Question Diagnostic
              </span>
              <span className="text-[10px] text-indigo-300 font-medium">AI & Teacher Quizzes</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Test Skills with AI Assistant
              </h3>
              <p className="text-[11px] text-indigo-200/80 mt-1 leading-relaxed">
                Launch an interactive 6-7 question assessment or tackle teacher-uploaded course exams.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("quizzes")}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Open Quiz Hub & Assessments
            </button>
          </div>

          {/* Upcoming Schedule / Live Classes */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Upcoming Virtual Classroom
            </h2>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-200/60 dark:border-indigo-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span>Interactive Live Room</span>
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px]">Open 24/7</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Join live sessions with instructors, collaborate on real-time whiteboards, or practice with AI.
              </p>
              <button
                onClick={() => onNavigateTab("live-class")}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Enter Virtual Classroom
              </button>
            </div>
          </div>

          {/* Personal Learning Goals */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" /> Personal Learning Goals
            </h2>
            <div className="space-y-2">
              {(!currentUser.goals || currentUser.goals.length === 0) ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set target goals in your Profile to track milestones.
                </p>
              ) : (
                currentUser.goals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{goal}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Community & Announcements
              </h2>
              <button
                onClick={() => onNavigateTab("messages")}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                All
              </button>
            </div>

            <div className="space-y-2">
              {recentMessages.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No broadcasts posted yet.</p>
              ) : (
                recentMessages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{msg.senderName || "Announcement"}</div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Student Feedback & Support Helpdesk Banner */}
          <div className="bg-gradient-to-br from-indigo-50 via-sky-50 to-blue-50 dark:from-indigo-950/40 dark:via-sky-950/30 dark:to-blue-950/40 rounded-3xl p-5 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Help Desk & Feedback</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct response from Administration</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Encountering a video bug, quiz issue, or have a suggestion to improve course materials?
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab("feedback")}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span>Submit Feedback or Grievance</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
