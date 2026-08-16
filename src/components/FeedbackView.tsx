import React, { useState } from "react";
import { User, Course, SystemComplaint, Role } from "../types";
import { 
  HelpCircle, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Star, 
  BookOpen, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Flame,
  LifeBuoy,
  FileQuestion,
  User as UserIcon,
  Search
} from "lucide-react";

interface FeedbackViewProps {
  currentUser: User | null;
  courses: Course[];
  complaints: SystemComplaint[];
  userRole: Role;
  onSubmitFeedback: (newComplaint: Partial<SystemComplaint>) => void;
  onOpenAiAssistant?: () => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  currentUser,
  courses = [],
  complaints = [],
  userRole,
  onSubmitFeedback,
  onOpenAiAssistant
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"submit" | "my-tickets" | "faq">("submit");
  
  // Form State
  const [category, setCategory] = useState<string>("Course Content");
  const [courseId, setCourseId] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [rating, setRating] = useState<number>(5);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [formSubmittedSuccess, setFormSubmittedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [searchTicketQuery, setSearchTicketQuery] = useState<string>("");

  const categories = [
    { id: "Course Content", label: "Course Content & Videos", icon: BookOpen, desc: "Lectures, downloadable files, audio/video playback" },
    { id: "Teacher / Faculty", label: "Faculty / Instructor", icon: UserIcon, desc: "Teacher feedback, grading clarification, communication" },
    { id: "Technical / Platform Bug", label: "Platform Bug / Technical", icon: ShieldAlert, desc: "Errors, login, upload issues, website glitches" },
    { id: "Assessment & Grades", label: "Quizzes & Assignment Grades", icon: FileQuestion, desc: "Test questions, grade corrections, deadline extensions" },
    { id: "Platform Suggestion", label: "Feature Suggestion", icon: Sparkles, desc: "Ideas to improve EduNex learning features" },
    { id: "General Feedback", label: "General Feedback", icon: MessageSquare, desc: "General institutional inquiries and student support" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Please provide details for your feedback or complaint.");
      return;
    }

    setErrorMsg("");
    const selectedCourse = courses.find(c => c.id === courseId);
    const courseTitle = selectedCourse ? selectedCourse.title : (courseId === "general" || !courseId ? "General Platform" : "General Inquiry");

    const isTeacher = String(userRole || currentUser?.role).toUpperCase() === "TEACHER";
    const senderRoleName = isTeacher ? "Teacher" : "Student";
    const fallbackName = isTeacher ? "Faculty Educator" : "Student User";
    const fallbackEmail = isTeacher ? "teacher@edunex.edu" : "student@edunex.edu";
    const fallbackId = isTeacher ? "FAC-2026-0001" : "STU-2026-0001";

    const newTicket: Partial<SystemComplaint> = {
      studentId: isAnonymous ? "anon-user" : (currentUser?.id || "usr-1"),
      studentOfficialId: isAnonymous ? "ANONYMOUS" : (currentUser?.officialId || currentUser?.id || fallbackId),
      studentName: isAnonymous ? `Anonymous (${senderRoleName})` : `${currentUser?.name || fallbackName} (${senderRoleName})`,
      studentEmail: isAnonymous ? "anonymous@edunex.edu" : (currentUser?.email || fallbackEmail),
      studentAvatar: isAnonymous 
        ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
        : (currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"),
      courseId: courseId || undefined,
      courseTitle,
      category,
      priority,
      rating,
      issue: subject.trim() ? `[${subject.trim()}] ${description.trim()}` : description.trim(),
      status: "OPEN"
    };

    onSubmitFeedback(newTicket);
    setFormSubmittedSuccess(true);
    setSubject("");
    setDescription("");
    setRating(5);
    setPriority("Medium");

    setTimeout(() => {
      setFormSubmittedSuccess(false);
      setActiveSubTab("my-tickets");
    }, 1800);
  };

  // Filter student's tickets
  const myTickets = complaints.filter(c => {
    if (!currentUser) return true;
    if (c.studentId === currentUser.id) return true;
    if (c.studentEmail === currentUser.email) return true;
    if (c.studentName === currentUser.name) return true;
    return false;
  });

  const filteredMyTickets = myTickets.filter(t => {
    if (!searchTicketQuery.trim()) return true;
    const q = searchTicketQuery.toLowerCase();
    return (
      (t.issue && t.issue.toLowerCase().includes(q)) ||
      (t.courseTitle && t.courseTitle.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q))
    );
  });

  const openTicketsCount = myTickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolvedTicketsCount = myTickets.filter(t => t.status === "RESOLVED").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-sky-200 border border-white/20">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Student Support & Direct Administration Feedback</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Feedback & Help Desk 💬
            </h1>
            <p className="text-sm text-indigo-100 max-w-xl">
              Share constructive course feedback, report technical glitches, or request faculty assistance. Every submission is monitored directly by platform Administrators.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveSubTab("submit")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                activeSubTab === "submit"
                  ? "bg-white text-indigo-700"
                  : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
              }`}
            >
              <Send className="w-4 h-4" />
              Submit Feedback
            </button>
            <button
              onClick={() => setActiveSubTab("my-tickets")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                activeSubTab === "my-tickets"
                  ? "bg-white text-indigo-700"
                  : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
              }`}
            >
              <Clock className="w-4 h-4" />
              My Tickets ({myTickets.length})
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab("submit")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === "submit"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>New Submission</span>
        </button>

        <button
          onClick={() => setActiveSubTab("my-tickets")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
            activeSubTab === "my-tickets"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Ticket History</span>
          {openTicketsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
              {openTicketsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("faq")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === "faq"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Frequently Asked Questions</span>
        </button>
      </div>

      {/* SUB TAB 1: SUBMIT FEEDBACK FORM */}
      {activeSubTab === "submit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> What would you like to share?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your feedback helps improve our curriculum, resolve software defects, and maintain academic excellence.
              </p>
            </div>

            {formSubmittedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3 animate-in zoom-in-95">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Feedback Submitted Successfully!</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Administrator has been notified in real-time. You can track status and admin replies in the "My Tickets" tab.
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selector Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Feedback / Complaint Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 shadow-xs ring-1 ring-indigo-500/30"
                            : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${
                          isSelected 
                            ? "bg-indigo-600 text-white" 
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? "text-indigo-900 dark:text-indigo-200" : "text-slate-800 dark:text-slate-200"}`}>
                            {cat.label}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {cat.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Related Course & Priority in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Associated Course (Optional)
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">General Platform (Not course-specific)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.instructorName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Urgency / Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["Low", "Medium", "High", "Urgent"] as const).map((p) => {
                      const isSelected = priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${
                            isSelected
                              ? p === "Urgent"
                                ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                                : p === "High"
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                : "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Subject Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject / Summary Headline
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Module 2 video audio stuttering, Quiz score discrepancy, etc."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Satisfaction Star Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Overall Experience Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    {rating === 5 ? "⭐⭐⭐⭐⭐ Excellent" : rating === 4 ? "⭐⭐⭐⭐ Good" : rating === 3 ? "⭐⭐⭐ Average" : rating === 2 ? "⭐⭐ Below Average" : "⭐ Needs Urgent Improvement"}
                  </span>
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Detailed Explanation / Issue Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue, question, or feedback in full detail so the Administration team can review and resolve it promptly..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                  <span>Admins read all submissions carefully.</span>
                  <span>{description.length} characters</span>
                </div>
              </div>

              {/* User Identity & Anonymous Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                    alt={currentUser?.name || "Student"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Submitting as: {isAnonymous ? "Anonymous Student" : (currentUser?.name || "Student")}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isAnonymous ? "Your identity is hidden" : `ID: ${currentUser?.officialId || currentUser?.id || "STU-2026-0001"}`}
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Submit Anonymously</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDescription("");
                    setSubject("");
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Feedback & Complaint
                </button>
              </div>
            </form>
          </div>

          {/* Right Info Column (1 col) */}
          <div className="space-y-6">
            {/* Quick Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin Resolution Protocol</h3>
                  <p className="text-[11px] text-slate-400">Guaranteed review within 24h</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Synchronized Storage:</strong> All tickets are saved permanently into the SQLite database backend.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Real-Time Broadcast:</strong> Administrators receive an instant push notification on submission.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Direct Admin Replies:</strong> When an admin responds, you can view their resolution in the "My Tickets" tab.</span>
                </div>
              </div>
            </div>

            {/* AI Assistant Help Helper */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50/30 dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-indigo-950/20 rounded-3xl p-6 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Academic Question?</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                If you have an urgent question about a coding concept, quiz explanation, or lesson math, try asking the Socratic AI Tutor for instant step-by-step guidance!
              </p>
              {onOpenAiAssistant && (
                <button
                  type="button"
                  onClick={onOpenAiAssistant}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Ask AI Tutor Instantly
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: MY TICKETS & HISTORY */}
      {activeSubTab === "my-tickets" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" /> My Submitted Feedback & Complaint Tickets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Track status updates and read official Administrator responses.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tickets by topic..."
                value={searchTicketQuery}
                onChange={(e) => setSearchTicketQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total Submitted</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">{myTickets.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">Under Review / Open</span>
              <span className="text-base font-extrabold text-amber-800 dark:text-amber-300">{openTicketsCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">Resolved with Admin Note</span>
              <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">{resolvedTicketsCount}</span>
            </div>
          </div>

          {/* Ticket List */}
          <div className="space-y-4">
            {filteredMyTickets.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Tickets Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  You haven't submitted any feedback or complaints yet. Click "Submit Feedback" above to report any issue.
                </p>
                <button
                  onClick={() => setActiveSubTab("submit")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  Create New Feedback Ticket
                </button>
              </div>
            ) : (
              filteredMyTickets.map((ticket) => {
                const isExpanded = expandedTicketId === ticket.id;
                const isResolved = ticket.status === "RESOLVED";
                const isInProgress = ticket.status === "IN_PROGRESS";

                return (
                  <div
                    key={ticket.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div
                      onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                      className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {ticket.courseTitle || "General Platform"}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {ticket.id}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {ticket.category || "General Feedback"}
                          </span>
                          {ticket.priority && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              ticket.priority === "Urgent"
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                                : ticket.priority === "High"
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                            }`}>
                              {ticket.priority} Priority
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                          {ticket.issue}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span>Submitted: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "Recent"}</span>
                          {ticket.rating && (
                            <span>Rating: {"⭐".repeat(ticket.rating)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-xl ${
                          isResolved
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : isInProgress
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                        }`}>
                          {isResolved ? "RESOLVED" : isInProgress ? "UNDER REVIEW" : "OPEN"}
                        </span>

                        <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Original Submission Details:
                          </h4>
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {ticket.issue}
                          </div>
                        </div>

                        {/* Admin Official Reply Section */}
                        {ticket.adminReply ? (
                          <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-md bg-indigo-600 text-white">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                  Official Administrator Response ({ticket.adminName || "Platform Director"})
                                </span>
                              </div>
                              {ticket.adminRepliedAt && (
                                <span className="text-[10px] text-indigo-500 dark:text-indigo-400">
                                  {new Date(ticket.adminRepliedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-indigo-950 dark:text-indigo-100 font-medium whitespace-pre-wrap leading-relaxed">
                              {ticket.adminReply}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>This ticket is currently queued for Administrator review. You will see their reply right here once addressed.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 3: FAQs */}
      {activeSubTab === "faq" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" /> Frequently Asked Support Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Find quick answers to common issues before submitting a ticket.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">How do I get my course completion certificate?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Complete all course modules, assignments, and achieve at least 70% in the quiz assessment. The certificate is automatically generated in your "Earned Certificates" tab.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">What should I do if a lesson video does not load?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ensure your internet connection is stable. If the video fails to stream, click "Submit Feedback" with the category "Platform Bug" and specify the lesson module name.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">How do I submit assignments for faculty grading?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Navigate to "My Assignments", select the active assignment card, paste your written response or code, and click "Submit Assignment".
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Are feedback submissions confidential?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! You can check the "Submit Anonymously" option anytime to keep your student name and ID completely private.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
