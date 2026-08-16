import React, { useState } from "react";
import { User, Course, Assignment, AssignmentSubmission } from "../types";
import { UserAvatar } from "./UserAvatar";
import { 
  Users, 
  Search, 
  Mail, 
  Award, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  Filter,
  Trash2,
  UserX,
  X,
  FileText,
  Eye,
  Calendar,
  AlertCircle,
  FileCheck,
  Download,
  ExternalLink,
  GraduationCap,
  Cpu,
  Dna
} from "lucide-react";

interface StudentsRosterViewProps {
  students: User[];
  courses: Course[];
  assignments: Assignment[];
  currentUser?: User;
  onSendMessage: (receiverId: string, message: string) => void;
  onOpenAiAssistant: () => void;
  onDeleteStudent?: (studentId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const StudentsRosterView: React.FC<StudentsRosterViewProps> = ({
  students = [],
  courses = [],
  assignments = [],
  currentUser,
  onSendMessage,
  onOpenAiAssistant,
  onDeleteStudent,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [selectedStudentForMsg, setSelectedStudentForMsg] = useState<User | null>(null);
  const [detailedStudent, setDetailedStudent] = useState<User | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const [directMsgText, setDirectMsgText] = useState("");
  const [msgSentNotice, setMsgSentNotice] = useState(false);

  // If viewed by teacher, find teacher's courses
  const isTeacher = currentUser && String(currentUser.role).toUpperCase() === "TEACHER";
  const teacherCourses = isTeacher ? (courses || []).filter(c => 
    c.instructorId === currentUser.id || 
    (c.instructorName && currentUser.name && c.instructorName.toLowerCase() === currentUser.name.toLowerCase()) ||
    (currentUser.officialId && c.instructorId === currentUser.officialId)
  ) : courses;
  const teacherCourseIds = teacherCourses.map(c => c.id);

  // Filter students who are enrolled in teacher's courses (if teacher)
  const studentList = (students || []).filter(u => {
    if (String(u.role).toUpperCase() !== "STUDENT") return false;
    if (isTeacher) {
      const enrolledIds = Array.isArray(u.enrolledCourseIds) ? u.enrolledCourseIds : [];
      return enrolledIds.some(cid => teacherCourseIds.includes(cid));
    }
    return true;
  });

  const availableCourses = isTeacher ? teacherCourses : courses;

  const filteredStudents = studentList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.officialId && s.officialId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const enrolledIds = Array.isArray(s.enrolledCourseIds) ? s.enrolledCourseIds : [];
    const matchesCourse = selectedCourseFilter === "all" || enrolledIds.includes(selectedCourseFilter);
    return matchesSearch && matchesCourse;
  });

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForMsg || !directMsgText.trim()) return;
    onSendMessage(selectedStudentForMsg.id, directMsgText);
    setDirectMsgText("");
    setMsgSentNotice(true);
    setTimeout(() => {
      setMsgSentNotice(false);
      setSelectedStudentForMsg(null);
    }, 2000);
  };

  // Helper to compute genuine metrics for a student without any fake data
  const getStudentMetrics = (student: User) => {
    const enrolledCourseIds = Array.isArray(student.enrolledCourseIds) ? student.enrolledCourseIds : [];
    const enrolledCourses = (courses || []).filter(c => enrolledCourseIds.includes(c.id));
    
    // Submissions for this student
    const studentSubs = (assignments || []).flatMap(a => 
      (a.submissions || []).filter(s => s.studentId === student.id || (s as any).studentEmail === student.email)
    );
    
    // Only genuine submissions graded by teacher with numerical grade
    const gradedSubs = studentSubs.filter(s => (s.status === "GRADED" || s.status === "graded") && typeof s.grade === "number");
    const pendingSubs = studentSubs.filter(s => s.status === "SUBMITTED" || s.status === "pending");
    
    const hasGrades = gradedSubs.length > 0;
    const avgGrade = hasGrades 
      ? Math.round(gradedSubs.reduce((acc, curr) => acc + (curr.grade || 0), 0) / gradedSubs.length)
      : null;

    return {
      enrolledCourses,
      enrolledCount: enrolledCourses.length,
      studentSubs,
      submissionCount: studentSubs.length,
      gradedSubs,
      gradedCount: gradedSubs.length,
      pendingSubs,
      pendingCount: pendingSubs.length,
      hasGrades,
      avgGrade
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" /> Student Roster & Gradebook
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time enrollment attendance, verified assignment submissions, and genuine instructor grades.
          </p>
        </div>

        <button
          onClick={onOpenAiAssistant}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          AI Performance Analytics
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student by name, ID, or email..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-64"
            />
          </div>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Enrolled Courses ({availableCourses.length})</option>
            {availableCourses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Showing {filteredStudents.length} of {studentList.length} Active Students
        </div>
      </div>

      {/* Empty State if No Students */}
      {filteredStudents.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Students Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchTerm || selectedCourseFilter !== "all" 
              ? "No students match your filter criteria. Try adjusting your search or course selection."
              : isTeacher 
                ? "No students are currently enrolled in your courses. When students attend and enroll in your courses, their verified attendance, submissions, and grades will appear here."
                : "No registered student accounts found on the platform."}
          </p>
        </div>
      ) : (
        /* Student Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => {
            const {
              enrolledCourses,
              enrolledCount,
              studentSubs,
              submissionCount,
              gradedSubs,
              gradedCount,
              hasGrades,
              avgGrade
            } = getStudentMetrics(student);

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Student Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatar={student.avatar}
                        name={student.name}
                        role={student.role}
                        size="lg"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-sm text-slate-900 dark:text-white">{student.name}</h2>
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {student.officialId || student.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{student.email}</p>
                        <span className="inline-block text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full mt-1">
                          {student.department || "Computer Science"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strictly Real Statistics Row (No Faked 88% or 2 Courses) */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Courses</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {enrolledCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Submissions</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {submissionCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Avg Grade</span>
                      {hasGrades ? (
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {avgGrade}%
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500" title="No graded assignments yet">
                          —
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attended Courses List Preview */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Attending Courses ({enrolledCount})
                    </span>
                    {enrolledCourses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {enrolledCourses.map(course => (
                          <span 
                            key={course.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800 line-clamp-1"
                            title={course.title}
                          >
                            {course.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Not enrolled in any courses yet
                      </p>
                    )}
                  </div>

                  {/* Recent Graded/Submitted Assignment Status Preview */}
                  {submissionCount > 0 && (
                    <div className="text-[11px] pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Work Status
                      </span>
                      <div className="space-y-1">
                        {studentSubs.slice(0, 2).map((sub, idx) => {
                          const assignment = assignments.find(a => (a.submissions || []).some(s => s === sub || s.studentId === student.id));
                          const isGraded = sub.status === "GRADED" && typeof sub.grade === "number";
                          return (
                            <div key={idx} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <span className="truncate max-w-[140px]">
                                {assignment?.title || `Assignment Submission #${idx + 1}`}
                              </span>
                              {isGraded ? (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                  {sub.grade}% (Graded)
                                </span>
                              ) : (
                                <span className="font-medium text-amber-600 dark:text-amber-400 shrink-0">
                                  Pending Grade
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {student.goals && student.goals.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Learning Focus</span>
                      <div className="flex flex-wrap gap-1">
                        {student.goals.map((g, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setDetailedStudent(student)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    title="View full academic record, enrolled courses, and graded assignments"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Academic Record</span>
                  </button>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab("learntwin")}
                      className="py-2 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-1"
                      title="Inspect student's AI Learning Twin, reasoning profile & failure simulator"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>LearnTwin</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedStudentForMsg(student)}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1"
                    title="Send direct feedback or guidance message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>

                  {onDeleteStudent && (
                    <button
                      onClick={() => setStudentToDelete(student)}
                      className="py-2 px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800/60 transition-all flex items-center justify-center"
                      title="Delete fake/invalid student account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED STUDENT ACADEMIC RECORD & GRADES MODAL */}
      {detailedStudent && (() => {
        const {
          enrolledCourses,
          enrolledCount,
          studentSubs,
          submissionCount,
          gradedSubs,
          gradedCount,
          pendingCount,
          hasGrades,
          avgGrade
        } = getStudentMetrics(detailedStudent);

        // Find assignments belonging to student's enrolled courses or submitted by student
        const relevantAssignments = (assignments || []).filter(a => 
          (detailedStudent.enrolledCourseIds || []).includes(a.courseId) ||
          (a.submissions || []).some(s => s.studentId === detailedStudent.id || (s as any).studentEmail === detailedStudent.email)
        );

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full space-y-6 my-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatar={detailedStudent.avatar}
                    name={detailedStudent.name}
                    role={detailedStudent.role}
                    size="lg"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{detailedStudent.name}</h2>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {detailedStudent.officialId || detailedStudent.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {detailedStudent.email} • {detailedStudent.department || "Computer Science"} • {detailedStudent.xp || 0} XP
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDetailedStudent(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3 Genuine KPI Cards - Calculated strictly on basis of actual data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Courses Attended */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs font-bold">Courses Attending</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{enrolledCount}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {enrolledCount > 0 ? "Active course enrollment(s)" : "No courses enrolled"}
                  </p>
                </div>

                {/* Submissions */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold">Assignment Submissions</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{submissionCount}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {gradedCount} graded • {pendingCount} pending grade
                  </p>
                </div>

                {/* Average Grade - Calculated only when graded */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-1">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-bold">Overall Average Grade</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {hasGrades ? `${avgGrade}%` : "—"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {hasGrades ? `Based on ${gradedCount} graded task(s)` : "No graded work yet"}
                  </p>
                </div>
              </div>

              {/* Section 1: Attended / Enrolled Courses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" /> Attended Course Modules ({enrolledCount})
                  </h3>
                </div>

                {enrolledCourses.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                    This student is not currently enrolled in any course. Once they join a course module, it will be listed here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {enrolledCourses.map(course => (
                      <div 
                        key={course.id} 
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{course.title}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Enrolled
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Instructor: {course.instructorName || "Faculty"} • Category: {course.category || "Technology"}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>{course.level || "Intermediate"}</span>
                          <span>•</span>
                          <span>{course.lessons?.length || course.lessonsCount || 0} Lessons</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Assignment Submissions & Actual Grade Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-600" /> Assignment Submissions & Verified Grades
                </h3>

                {relevantAssignments.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                    No assignments found for this student's enrolled courses.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {relevantAssignments.map(assignment => {
                      const submission = (assignment.submissions || []).find(
                        s => s.studentId === detailedStudent.id || (s as any).studentEmail === detailedStudent.email
                      );
                      const isGraded = submission && (submission.status === "GRADED" || submission.status === "graded") && typeof submission.grade === "number";
                      const isPending = submission && (submission.status === "SUBMITTED" || submission.status === "pending" || !isGraded);
                      const notSubmitted = !submission;

                      return (
                        <div 
                          key={assignment.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {assignment.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Due: {assignment.deadline || "No deadline"} • Max Points: {assignment.totalPoints || 100}
                              </p>
                            </div>

                            {/* Status & Grade Tag */}
                            <div>
                              {isGraded ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Grade: {submission.grade}% ({submission.grade}/{assignment.totalPoints || 100})</span>
                                </div>
                              ) : isPending ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Submitted (Awaiting Grade)</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                  <span>Not Submitted</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Submission Details If Turned In */}
                          {submission && (
                            <div className="mt-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
                              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                <span>Submitted: {submission.submittedAt || "Recently"}</span>
                                {submission.fileUrl && (
                                  <a 
                                    href={submission.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View Submitted File ({submission.fileName || "Attachment"})
                                  </a>
                                )}
                              </div>

                              {submission.content && (
                                <p className="text-slate-700 dark:text-slate-300 text-xs bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg font-mono">
                                  {submission.content}
                                </p>
                              )}

                              {isGraded && submission.feedback && (
                                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Teacher Feedback
                                  </span>
                                  <p className="text-xs text-emerald-800 dark:text-emerald-300 italic mt-0.5">
                                    "{submission.feedback}"
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentForMsg(detailedStudent);
                    setDetailedStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Direct Message</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailedStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-sm"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
              Are you sure you want to delete this student account? This will permanently remove <strong>{studentToDelete.name}</strong> from all course rosters, submissions, and platform directory (useful for removing fake or test accounts).
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

      {/* Direct Message / Feedback Modal */}
      {selectedStudentForMsg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <UserAvatar avatar={selectedStudentForMsg.avatar} name={selectedStudentForMsg.name} role={selectedStudentForMsg.role} size="md" />
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">Message {selectedStudentForMsg.name}</h2>
                  <p className="text-[11px] text-slate-400">Direct instructor guidance & mentorship</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForMsg(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {msgSentNotice ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Message delivered to student inbox!
              </div>
            ) : (
              <form onSubmit={handleSendDirectMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Feedback / Assignment Guidance
                  </label>
                  <textarea
                    rows={4}
                    value={directMsgText}
                    onChange={(e) => setDirectMsgText(e.target.value)}
                    placeholder={`Hello ${selectedStudentForMsg.name}, here is some feedback on your course assignments...`}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForMsg(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" /> Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
