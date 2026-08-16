import React from "react";
import { Course, Assignment, Quiz, User } from "../types";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Award,
  AlertTriangle,
  FileText
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface TeacherReportsViewProps {
  courses: Course[];
  assignments: Assignment[];
  quizzes: Quiz[];
  students: User[];
  onOpenAiAssistant: () => void;
}

export const TeacherReportsView: React.FC<TeacherReportsViewProps> = ({
  courses = [],
  assignments = [],
  quizzes = [],
  students = [],
  onOpenAiAssistant
}) => {
  const studentCount = students.filter(u => String(u.role).toUpperCase() === "STUDENT").length;
  
  // Dynamic analytics data based on real courses
  const courseEnrollmentData = courses.map((c) => ({
    name: c.title.length > 18 ? c.title.substring(0, 16) + "..." : c.title,
    enrolled: c.enrolledCount || 0,
    lessons: c.lessons?.length || c.lessonsCount || 0
  }));

  const quizData = quizzes.map((q) => ({
    name: q.title.length > 18 ? q.title.substring(0, 16) + "..." : q.title,
    questions: q.questions.length,
    timeLimit: q.timeLimitMinutes
  }));

  const totalSubmissions = assignments.reduce((acc, a) => acc + (a.submissions?.length || 0), 0);
  const gradedSubmissions = assignments.reduce(
    (acc, a) => acc + (a.submissions?.filter(s => s.grade !== undefined).length || 0),
    0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" /> Academic Reports & Cohort Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analyze class enrollment distributions, track assignment completions, and evaluate cohort growth.
          </p>
        </div>

        <button
          onClick={onOpenAiAssistant}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Generate AI Cohort Summary
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400">Active Students</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{studentCount}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Registered learners</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400">Published Courses</p>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{courses.length}</p>
          <span className="text-[10px] text-purple-600 font-bold">Curriculum modules</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400">Total Submissions</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalSubmissions}</p>
          <span className="text-[10px] text-slate-400">{gradedSubmissions} graded</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400">Active Quizzes</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{quizzes.length}</p>
          <span className="text-[10px] text-slate-400">Assessments</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Enrollment & Modules */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" /> Course Lesson Density
            </h2>
            <span className="text-[11px] text-slate-400">Modules per Course</span>
          </div>

          {courseEnrollmentData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No courses created yet to plot analytics.
            </div>
          ) : (
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseEnrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="lessons" fill="#9333ea" radius={[8, 8, 0, 0]} name="Total Lessons" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quiz Metrics */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Quiz Question Volume
            </h2>
            <span className="text-[11px] text-slate-400">Questions per Assessment</span>
          </div>

          {quizData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No quizzes created yet. Create a quiz to view test distribution.
            </div>
          ) : (
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="questions" fill="#6366f1" radius={[8, 8, 0, 0]} name="Questions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* AI Diagnostic Recommendations */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-purple-950/20 border border-purple-200/60 dark:border-purple-800/60 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Instructional Assistant</h2>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          Use the AI Teaching Tools in the top banner or AI Assistant sidepanel to generate instant quizzes, lesson outlines, code challenges, and rubric scoring for student assignments.
        </p>
      </div>
    </div>
  );
};
