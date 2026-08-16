import React, { useState } from "react";
import { Certificate, Role, User, Course, SystemComplaint } from "../types";
import { EduNexLogoMark } from "./EduNexLogo";
import { 
  Award, 
  Download, 
  Share2, 
  CheckCircle, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  MessageSquare,
  HelpCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  Eye,
  CheckCircle2,
  FileCheck
} from "lucide-react";

interface CertificatesViewProps {
  certificates: Certificate[];
  currentUser: User | null;
  userRole: Role;
  courses?: Course[];
  users?: User[];
  complaints?: SystemComplaint[];
  onOpenAiAssistant: () => void;
  onNavigateTab?: (tab: string) => void;
  onUpdateComplaint?: (id: string, updates: { status?: string; adminReply?: string; adminName?: string }) => void;
  onDeleteComplaint?: (id: string) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates = [],
  currentUser,
  userRole,
  courses = [],
  users = [],
  complaints = [],
  onOpenAiAssistant,
  onNavigateTab,
  onUpdateComplaint,
  onDeleteComplaint
}) => {
  const roleUpper = String(userRole || currentUser?.role).toUpperCase();
  const isStudent = roleUpper === "STUDENT";
  const isTeacher = roleUpper === "TEACHER";
  const isAdmin = roleUpper === "ADMIN";

  // Admin Tab State: "certificates" | "complaints"
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<"certificates" | "complaints">("certificates");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [complaintRoleFilter, setComplaintRoleFilter] = useState<string>("ALL");
  const [copiedCertId, setCopiedCertId] = useState<string | null>(null);

  // Student Earned Certificates (only the logged-in student)
  const studentCertificates = certificates.filter(cert => {
    if (!currentUser) return true;
    return cert.studentId === currentUser.id || cert.studentName.toLowerCase() === currentUser.name.toLowerCase();
  });

  // Active courses for teacher
  const teacherCourses = isTeacher
    ? courses.filter(c => 
        c.instructorId === currentUser?.id || 
        (c.instructorName && currentUser?.name && c.instructorName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (currentUser?.officialId && c.instructorId === currentUser.officialId)
      )
    : courses;
  const activeTeacherCourses = teacherCourses.length > 0 ? teacherCourses : courses;
  const activeCourseIds = activeTeacherCourses.map(c => c.id);

  // Group certificates by course for Teacher view
  const courseCertificateSummary = activeTeacherCourses.map(course => {
    const courseCerts = certificates.filter(c => 
      c.courseId === course.id || 
      (c.courseTitle && course.title && c.courseTitle.toLowerCase() === course.title.toLowerCase())
    );
    return {
      course,
      count: courseCerts.length,
      certificates: courseCerts
    };
  });

  // Filter complaints for Admin Certificate tab integrated view
  const filteredComplaints = complaints.filter(c => {
    if (complaintRoleFilter === "STUDENT") {
      const isTeacherSubmission = c.studentName?.toLowerCase().includes("(teacher)") || c.studentOfficialId?.startsWith("FAC");
      if (isTeacherSubmission) return false;
    } else if (complaintRoleFilter === "TEACHER") {
      const isTeacherSubmission = c.studentName?.toLowerCase().includes("(teacher)") || c.studentOfficialId?.startsWith("FAC");
      if (!isTeacherSubmission) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchIssue = c.issue?.toLowerCase().includes(q);
      const matchAuthor = c.studentName?.toLowerCase().includes(q);
      const matchCourse = c.courseTitle?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      return matchIssue || matchAuthor || matchCourse || matchCat;
    }

    return true;
  });

  // Export All Certificates for Student
  const handleExportAllCertificates = () => {
    if (studentCertificates.length === 0) {
      alert("No certificates have been earned yet. Complete a course and pass its quiz with 85%+ to earn your first certificate!");
      return;
    }

    const exportData = {
      institution: "EduNex Verified Digital Academy",
      studentName: currentUser?.name || "Student",
      studentId: currentUser?.officialId || currentUser?.id || "STU-REG",
      studentEmail: currentUser?.email,
      exportedAt: new Date().toISOString(),
      totalCertificates: studentCertificates.length,
      certificates: studentCertificates.map(c => ({
        id: c.certificateId || c.id,
        courseTitle: c.courseTitle,
        issueDate: c.issueDate,
        scorePercent: c.scorePercent || 100,
        teacherName: c.teacherName || "Academic Faculty",
        verificationHash: c.issueHash || `SHA256-${c.id}`,
        skillsVerified: c.skillsVerified || c.skillsEarned || ["Course Mastery"],
        verificationUrl: `https://edunex.edu/verify/${c.issueHash || c.id}`
      }))
    };

    // Download JSON transcript / printable certificate summary
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EduNex_Certificates_${currentUser?.name?.replace(/\s+/g, "_") || "Transcript"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Successfully exported ${studentCertificates.length} verified certificate records as an official cryptographic credential portfolio.`);
  };

  const handleCopyLink = (certId: string, hash?: string) => {
    const link = `https://edunex.edu/verify/${hash || certId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedCertId(certId);
      setTimeout(() => setCopiedCertId(null), 2500);
    } else {
      alert(`Verification URL: ${link}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isStudent && "My Earned Course Certificates 🎓"}
                {isTeacher && "Course Certificate Issuance Records 📋"}
                {isAdmin && "Platform Certificate & Feedback Records 🛡️"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isStudent && "Cryptographically verified certificates earned by completing courses and scoring 85%+ on final exams."}
                {isTeacher && "Monitor the count of certificates awarded per course and the list of student recipients."}
                {isAdmin && "Official certificate registry, recipient audits, and integrated student & faculty feedback records."}
              </p>
            </div>
          </div>
        </div>

        {/* Export All Certificates Button - STRICTLY VISIBLE ONLY FOR STUDENTS */}
        {isStudent && (
          <button
            onClick={handleExportAllCertificates}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-90 transition-all flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" /> Export All Certificates
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: STUDENT EARNED CERTIFICATES                                      */}
      {/* ========================================================================= */}
      {isStudent && (
        <div className="space-y-6">
          {studentCertificates.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Certificates Earned Yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Earn official verified certificates by completing course modules and scoring <strong>85% or higher</strong> on the corresponding course quiz.
                </p>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("courses")}
                    className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Browse Courses to Start Learning
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-xl overflow-hidden space-y-5 flex flex-col justify-between"
                >
                  {/* Background Watermark */}
                  <div className="absolute -top-4 -right-4 p-8 opacity-15 pointer-events-none">
                    <EduNexLogoMark size={160} />
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-white/10 backdrop-blur-xs">
                          <EduNexLogoMark size={24} />
                        </div>
                        <span className="text-xs font-black tracking-tight text-white">EduNex Official Credential</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED (≥85%)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Awarded To</span>
                      <h2 className="text-xl font-black text-white tracking-wide">{cert.studentName}</h2>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Course Completed</span>
                      <h3 className="text-base font-bold text-indigo-200">{cert.courseTitle}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-indigo-200">
                      <span className="font-semibold">Instructor: {cert.teacherName || "Academic Faculty"}</span>
                      {cert.scorePercent && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                          Score: {cert.scorePercent}%
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(cert.skillsVerified || cert.skillsEarned || ["Course Mastery", "Assessment Excellence"]).map((sk, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-900/60 text-indigo-300 border border-indigo-700/50"
                        >
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-indigo-900/60 flex items-center justify-between relative z-10 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Issued: {cert.issueDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(cert.id, cert.issueHash)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-1 text-xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {copiedCertId === cert.id ? "Copied Link!" : "Share Link"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: TEACHER DASHBOARD CERTIFICATE VIEW                                */}
      {/* "in the teacher dashboard only allow them to see the no of certificate    */}
      {/*  issued in each course and the student whom this certificate are issued"  */}
      {/* ========================================================================= */}
      {isTeacher && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" /> Course Certificate Summary
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing number of certificates issued in each course and the recipient students.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Filter Course:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-medium"
                >
                  <option value="all">All Courses ({courseCertificateSummary.length})</option>
                  {activeTeacherCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {courseCertificateSummary.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                No courses available. Create a course to begin issuing certificates.
              </p>
            ) : (
              <div className="space-y-6">
                {courseCertificateSummary
                  .filter(item => selectedCourseFilter === "all" || item.course.id === selectedCourseFilter)
                  .map(({ course, count, certificates: courseCerts }) => (
                    <div
                      key={course.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{course.title}</h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{course.category} • {course.level}</span>
                          </div>
                        </div>

                        <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <Award className="w-4 h-4 text-amber-300" />
                          {count} {count === 1 ? "Certificate Issued" : "Certificates Issued"}
                        </span>
                      </div>

                      {/* Students List */}
                      {courseCerts.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          No certificates issued in this course yet (Students must score ≥ 85% on course quiz).
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {courseCerts.map((cert) => {
                            const matchedStudent = users.find(u => u.id === cert.studentId || u.name === cert.studentName);
                            return (
                              <div
                                key={cert.id}
                                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={matchedStudent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                                    alt={cert.studentName}
                                    className="w-9 h-9 rounded-full object-cover shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                      {cert.studentName}
                                    </h4>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                      ID: {matchedStudent?.officialId || cert.studentId || "STU-REG"}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3" /> Score: {cert.scorePercent || 100}%
                                  </span>
                                  <span className="text-slate-400">{cert.issueDate}</span>
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ADMIN VIEW (Certificates Records + Integrated Feedback & Complaints) */}
      {/* "feedback and complaints from student and teachers should be visible to    */}
      {/*  admin on his feedback and complaints tab and in the certificate records   */}
      {/*  tab in admin"                                                            */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Sub-tab Switcher for Admin */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdminActiveSubTab("certificates")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  adminActiveSubTab === "certificates"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Issued Certificates Registry ({certificates.length})
              </button>

              <button
                onClick={() => setAdminActiveSubTab("complaints")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  adminActiveSubTab === "complaints"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Feedback & Complaints Records ({complaints.length})
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Administrator Oversight Center
            </span>
          </div>

          {/* SUB-TAB 1: CERTIFICATES REGISTRY */}
          {adminActiveSubTab === "certificates" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" /> Platform Issued Certificates Log
                </h2>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Course Filter:</span>
                  <select
                    value={selectedCourseFilter}
                    onChange={(e) => setSelectedCourseFilter(e.target.value)}
                    className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="all">All Courses</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {certificates.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                  No verified certificates have been issued on the platform yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="pb-3">Certificate ID</th>
                        <th className="pb-3">Student Name</th>
                        <th className="pb-3">Course Title</th>
                        <th className="pb-3">Score</th>
                        <th className="pb-3">Issue Date</th>
                        <th className="pb-3">Verification Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {certificates
                        .filter(cert => selectedCourseFilter === "all" || cert.courseId === selectedCourseFilter)
                        .map((cert) => (
                          <tr key={cert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {cert.certificateId || cert.id}
                            </td>
                            <td className="py-3.5 font-semibold text-slate-900 dark:text-white">
                              {cert.studentName}
                            </td>
                            <td className="py-3.5 text-slate-700 dark:text-slate-300">
                              {cert.courseTitle}
                            </td>
                            <td className="py-3.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                                {cert.scorePercent || 100}%
                              </span>
                            </td>
                            <td className="py-3.5 text-slate-500">{cert.issueDate}</td>
                            <td className="py-3.5 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                              {cert.issueHash || cert.id}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: INTEGRATED FEEDBACK & COMPLAINTS (FROM STUDENTS AND TEACHERS) */}
          {adminActiveSubTab === "complaints" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" /> Student & Teacher Feedback Audit
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Complaints and constructive suggestions submitted by enrolled students and faculty educators.
                  </p>
                </div>

                {/* Filter by role */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Author Role:</span>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(["ALL", "STUDENT", "TEACHER"] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setComplaintRoleFilter(r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          complaintRoleFilter === r
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {r === "ALL" ? "All" : r === "STUDENT" ? "Students" : "Faculty"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredComplaints.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                  No feedback or complaints matching criteria.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredComplaints.map((ticket) => {
                    const isTeacherTicket = ticket.studentName?.toLowerCase().includes("(teacher)") || ticket.studentOfficialId?.startsWith("FAC");
                    return (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isTeacherTicket 
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                                : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800"
                            }`}>
                              {isTeacherTicket ? "Teacher / Faculty" : "Student"}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{ticket.studentName}</span>
                            <span className="text-[10px] text-slate-400">({ticket.studentOfficialId || ticket.studentEmail || "ID-N/A"})</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                              {ticket.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ticket.status === "OPEN" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                              ticket.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                              "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          {ticket.issue}
                        </p>

                        {ticket.adminReply && (
                          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                            <strong>Admin Reply:</strong> {ticket.adminReply}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
