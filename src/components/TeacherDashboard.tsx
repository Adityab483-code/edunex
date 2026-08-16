import React, { useState } from "react";
import { User, Course, Assignment, ChatMessage, Certificate } from "../types";
import { UserAvatar } from "./UserAvatar";
import { EduNexLogoMark } from "./EduNexLogo";
import { 
  Users, 
  BookOpen, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  Send, 
  CheckCircle2, 
  Plus, 
  Clock, 
  MessageSquare,
  TrendingUp,
  Award,
  Trash2,
  UserX,
  X,
  GraduationCap,
  Calendar,
  ShieldCheck
} from "lucide-react";

interface TeacherDashboardProps {
  currentUser: User;
  courses: Course[];
  assignments: Assignment[];
  users: User[];
  certificates?: Certificate[];
  onNavigateTab: (tab: string) => void;
  onOpenAiAssistant: () => void;
  onSendBroadcast: (text: string, courseId?: string) => void;
  onDeleteStudent?: (studentId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  courses = [],
  assignments = [],
  users = [],
  certificates = [],
  onNavigateTab,
  onOpenAiAssistant,
  onSendBroadcast,
  onDeleteStudent
}) => {
  const [announcementText, setAnnouncementText] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [sentSuccess, setSentSuccess] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const [enrolledSearchTerm, setEnrolledSearchTerm] = useState("");
  const [enrolledCourseFilter, setEnrolledCourseFilter] = useState("all");
  const [certCourseFilter, setCertCourseFilter] = useState("all");

  // Courses taught by this faculty teacher
  const teacherCourses = (courses || []).filter(c => 
    c.instructorId === currentUser?.id || 
    (c.instructorName && currentUser?.name && c.instructorName.toLowerCase() === currentUser.name.toLowerCase()) ||
    (currentUser?.officialId && c.instructorId === currentUser.officialId)
  );
  const teacherCourseIds = teacherCourses.map(c => c.id);
  const activeTeacherCourses = teacherCourses.length > 0 ? teacherCourses : courses;
  const activeCourseIds = activeTeacherCourses.map(c => c.id);

  // Certificates for courses taught by this teacher (or all active)
  const teacherCertificates = (certificates || []).filter(cert => 
    (cert.courseId && activeCourseIds.includes(cert.courseId)) ||
    (cert.teacherName && currentUser?.name && cert.teacherName.toLowerCase() === currentUser.name.toLowerCase()) ||
    activeTeacherCourses.some(c => c.title.toLowerCase() === cert.courseTitle.toLowerCase())
  );

  // Group certificates by course
  const courseCertSummary = activeTeacherCourses.map(course => {
    const issuedCerts = teacherCertificates.filter(cert => 
      cert.courseId === course.id || cert.courseTitle.toLowerCase() === course.title.toLowerCase()
    );
    return {
      course,
      count: issuedCerts.length,
      certificates: issuedCerts
    };
  });

  // Only students enrolled in this teacher's specific courses
  const enrolledStudents = (users || []).filter(u => {
    if (String(u.role).toUpperCase() !== "STUDENT") return false;
    const enrolledIds = Array.isArray(u.enrolledCourseIds) ? u.enrolledCourseIds : [];
    return enrolledIds.some(cid => teacherCourseIds.includes(cid));
  });

  // Filtered enrolled students for the interactive section
  const filteredEnrolledStudents = enrolledStudents.filter(std => {
    const matchesSearch = std.name.toLowerCase().includes(enrolledSearchTerm.toLowerCase()) ||
                          std.email.toLowerCase().includes(enrolledSearchTerm.toLowerCase()) ||
                          (std.officialId && std.officialId.toLowerCase().includes(enrolledSearchTerm.toLowerCase()));
    const enrolledIds = Array.isArray(std.enrolledCourseIds) ? std.enrolledCourseIds : [];
    const matchesCourse = enrolledCourseFilter === "all" || enrolledIds.includes(enrolledCourseFilter);
    return matchesSearch && matchesCourse;
  });
  
  // Pending submissions to grade across assignments for teacher's courses
  const teacherAssignments = (assignments || []).filter(a => 
    teacherCourseIds.includes(a.courseId) || a.instructorId === currentUser?.id
  );
  const pendingSubmissions = (teacherAssignments.length > 0 ? teacherAssignments : assignments).flatMap(a => 
    (a.submissions || []).filter(s => String(s.status).toUpperCase() === "SUBMITTED" || String(s.status).toUpperCase() === "PENDING")
  );

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    onSendBroadcast(announcementText, selectedCourseId);
    setAnnouncementText("");
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <EduNexLogoMark size={180} />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Faculty Educator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {currentUser.name}! 👨‍🏫
          </h1>
          <p className="text-sm text-purple-100 max-w-xl">
            Manage your courses, monitor enrolled student cohorts, evaluate submissions, and guide student learning with AI assistance.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onOpenAiAssistant}
            className="px-4 py-2.5 rounded-xl bg-white text-purple-800 hover:bg-slate-100 font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            AI Teaching Tools
          </button>
          <button
            onClick={() => onNavigateTab("courses")}
            className="px-4 py-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-900/70 text-white border border-white/20 font-bold text-xs backdrop-blur-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>
      </div>

      {/* Stats Cards - Teacher specific stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Students Enrolled in My Courses */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Students in Courses</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{enrolledStudents.length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Courses</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{teacherCourses.length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pending Grading</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{pendingSubmissions.length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Assignments</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{(teacherAssignments.length > 0 ? teacherAssignments : assignments).length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Certificates Issued</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{teacherCertificates.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Students Enrolled in My Courses & Submissions Needing Grading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Enrolled Students Roster & Grading Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ENROLLED STUDENTS IN MY COURSES SECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" /> Students Enrolled in My Courses
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live roster of students actively enrolled in your course modules.
                </p>
              </div>

              {/* Course & Search Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={enrolledSearchTerm}
                    onChange={(e) => setEnrolledSearchTerm(e.target.value)}
                    placeholder="Search enrolled..."
                    className="pl-3 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {teacherCourses.length > 1 && (
                  <select
                    value={enrolledCourseFilter}
                    onChange={(e) => setEnrolledCourseFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="all">All My Courses</option>
                    {teacherCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => onNavigateTab("students")}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline px-2 py-1"
                >
                  Full Directory
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {enrolledStudents.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No students currently enrolled in your courses
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    When students register and enroll in your course modules ({teacherCourses.length > 0 ? teacherCourses.map(c => c.title).join(", ") : "your courses"}), their profile, enrollment status, and progress metrics will appear here.
                  </p>
                </div>
              ) : filteredEnrolledStudents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No enrolled students matched your search criteria.
                </div>
              ) : (
                filteredEnrolledStudents.map((std) => {
                  // Find which of this teacher's courses this student is in
                  const enrolledInTeacherCourses = teacherCourses.filter(c => 
                    std.enrolledCourseIds?.includes(c.id)
                  );

                  return (
                    <div 
                      key={std.id} 
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 dark:hover:border-purple-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar avatar={std.avatar} name={std.name} role={std.role} size="md" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{std.name}</span>
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {std.officialId || std.id}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {std.email} • XP: {std.xp || 0}
                          </p>

                          {/* Enrolled course tags */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {enrolledInTeacherCourses.map(course => (
                              <span 
                                key={course.id}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800"
                              >
                                {course.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={onOpenAiAssistant}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Plan
                        </button>
                        <button
                          onClick={() => onNavigateTab("messages")}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300"
                        >
                          Message
                        </button>
                        {onDeleteStudent && (
                          <button
                            onClick={() => setStudentToDelete(std)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800/60 flex items-center gap-1"
                            title="Delete fake or invalid student account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Teacher Delete Student Confirmation Modal */}
          {studentToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Fake Student Account</h3>
                      <p className="text-[11px] text-slate-400">Instructor moderation & roster cleanup</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStudentToDelete(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                  <UserAvatar avatar={studentToDelete.avatar} name={studentToDelete.name} role={studentToDelete.role} size="md" />
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{studentToDelete.name}</div>
                    <div className="text-[11px] text-slate-400">{studentToDelete.email}</div>
                    <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Student Account
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Are you sure you want to delete this student account? This will immediately remove <strong>{studentToDelete.name}</strong> from all course rosters, submissions, and platform directory. This action cannot be undone.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStudentToDelete(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (studentToDelete && onDeleteStudent) {
                        onDeleteStudent(studentToDelete.id);
                        setStudentToDelete(null);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Student</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Submissions Queue */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Assignment Submissions Needing Review
              </h2>
              <button
                onClick={() => onNavigateTab("assignments")}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Go to Grading Center
              </button>
            </div>

            {pendingSubmissions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                🎉 All student submissions are currently graded!
              </p>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map((sub, idx) => (
                  <div key={sub.studentId || idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={sub.studentAvatar} alt={sub.studentName} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{sub.studentName}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{sub.content}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab("assignments")}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shrink-0"
                    >
                      Review & Grade
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COURSE CERTIFICATES ISSUED (TEACHER VIEW) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" /> Issued Course Certificates
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track the total count of certificates awarded per course and the list of student recipients.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Course:</span>
                <select
                  value={certCourseFilter}
                  onChange={(e) => setCertCourseFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="all">All Courses ({courseCertSummary.length})</option>
                  {activeTeacherCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {courseCertSummary.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                No active courses available to issue certificates.
              </p>
            ) : (
              <div className="space-y-4">
                {courseCertSummary
                  .filter(item => certCourseFilter === "all" || item.course.id === certCourseFilter)
                  .map(({ course, count, certificates: courseCerts }) => (
                    <div key={course.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white">{course.title}</h3>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{course.category} • {course.level}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            {count} {count === 1 ? "Certificate" : "Certificates"} Issued
                          </span>
                        </div>
                      </div>

                      {/* Students List whom certificate is issued */}
                      {courseCerts.length === 0 ? (
                        <div className="py-3 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          No students have earned certificates in this course yet (Requires passing course quiz with ≥ 85%).
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {courseCerts.map((cert) => {
                            const matchedStudent = users.find(u => u.id === cert.studentId || u.name === cert.studentName);
                            return (
                              <div
                                key={cert.id}
                                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={matchedStudent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                                    alt={cert.studentName}
                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                      {cert.studentName}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                      <span>ID: {matchedStudent?.officialId || cert.studentId || "STU-REG"}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                        <ShieldCheck className="w-2.5 h-2.5" /> {cert.scorePercent || 100}%
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-[10px] font-mono text-slate-400 block">{cert.certificateId || cert.id}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{cert.issueDate}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Broadcast Announcement & Quick Actions */}
        <div className="space-y-6">
          {/* Send Broadcast Announcement */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" /> Send Course Announcement
            </h2>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Select Target Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Announcement Message
                </label>
                <textarea
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g., Live Q&A session scheduled for Thursday..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {sentSuccess && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Broadcast sent successfully!
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send Announcement
              </button>
            </form>
          </div>

          {/* Quick AI Tools Cards */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">AI Faculty Co-Pilot</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Instantly generate MCQ quizzes, draft assignment rubrics, or create lesson modules using Google Gemini.
            </p>
            <button
              onClick={onOpenAiAssistant}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
            >
              Launch Generator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
