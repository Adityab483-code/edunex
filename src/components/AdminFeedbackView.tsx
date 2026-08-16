import React, { useState } from "react";
import { User, Course, SystemComplaint } from "../types";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  MessageSquare, 
  Send, 
  Trash2, 
  Star, 
  Sparkles, 
  User as UserIcon, 
  BookOpen, 
  ShieldCheck, 
  CornerDownRight, 
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Mail,
  Flame,
  Check
} from "lucide-react";

interface AdminFeedbackViewProps {
  currentUser: User | null;
  complaints: SystemComplaint[];
  courses: Course[];
  onUpdateComplaint: (id: string, updates: { status?: string; adminReply?: string; adminName?: string }) => void;
  onDeleteComplaint: (id: string) => void;
  onRefreshComplaints?: () => void;
}

export const AdminFeedbackView: React.FC<AdminFeedbackViewProps> = ({
  currentUser,
  complaints = [],
  courses = [],
  onUpdateComplaint,
  onDeleteComplaint,
  onRefreshComplaints
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Replying state per ticket
  const [replyTextMap, setReplyTextMap] = useState<{ [key: string]: string }>({});
  const [statusSelectMap, setStatusSelectMap] = useState<{ [key: string]: string }>({});
  const [expandedMap, setExpandedMap] = useState<{ [key: string]: boolean }>({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>("");

  const totalCount = complaints.length;
  const openCount = complaints.filter(c => c.status === "OPEN").length;
  const inProgressCount = complaints.filter(c => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter(c => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const urgentCount = complaints.filter(c => c.priority === "Urgent" && c.status !== "RESOLVED").length;

  const filteredComplaints = complaints.filter(c => {
    // Status Filter
    if (filterStatus === "OPEN" && c.status !== "OPEN") return false;
    if (filterStatus === "IN_PROGRESS" && c.status !== "IN_PROGRESS") return false;
    if (filterStatus === "RESOLVED" && c.status !== "RESOLVED" && c.status !== "CLOSED") return false;
    
    // Priority Filter
    if (filterPriority !== "ALL" && c.priority !== filterPriority) return false;

    // Category Filter
    if (filterCategory !== "ALL" && c.category !== filterCategory) return false;

    // Role Filter
    const isTeacherTicket = (c.submitterRole && String(c.submitterRole).toUpperCase() === "TEACHER") || c.studentName?.toLowerCase().includes("(teacher)") || Boolean(c.studentOfficialId?.startsWith("FAC"));
    if (filterRole === "STUDENT" && isTeacherTicket) return false;
    if (filterRole === "TEACHER" && !isTeacherTicket) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.studentName?.toLowerCase().includes(q);
      const matchId = c.studentOfficialId?.toLowerCase().includes(q) || c.studentId?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q);
      const matchEmail = c.studentEmail?.toLowerCase().includes(q);
      const matchCourse = c.courseTitle?.toLowerCase().includes(q);
      const matchIssue = c.issue?.toLowerCase().includes(q);
      const matchCategory = c.category?.toLowerCase().includes(q);
      return matchName || matchId || matchEmail || matchCourse || matchIssue || matchCategory;
    }

    return true;
  });

  const handleReplyChange = (id: string, text: string) => {
    setReplyTextMap(prev => ({ ...prev, [id]: text }));
  };

  const handleStatusChange = (id: string, status: string) => {
    setStatusSelectMap(prev => ({ ...prev, [id]: status }));
  };

  const toggleExpand = (id: string) => {
    setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveResolution = (ticket: SystemComplaint) => {
    const text = replyTextMap[ticket.id] !== undefined ? replyTextMap[ticket.id] : (ticket.adminReply || "");
    const newStatus = statusSelectMap[ticket.id] || (text.trim() ? "RESOLVED" : ticket.status);

    onUpdateComplaint(ticket.id, {
      status: newStatus,
      adminReply: text.trim(),
      adminName: currentUser?.name || "Administrator"
    });

    setActionSuccessMsg(`Ticket #${ticket.id} status updated to ${newStatus}`);
    setTimeout(() => setActionSuccessMsg(""), 3000);
  };

  const handleQuickResolve = (ticket: SystemComplaint, template: string) => {
    onUpdateComplaint(ticket.id, {
      status: "RESOLVED",
      adminReply: template,
      adminName: currentUser?.name || "Administrator"
    });

    setReplyTextMap(prev => ({ ...prev, [ticket.id]: template }));
    setStatusSelectMap(prev => ({ ...prev, [ticket.id]: "RESOLVED" }));

    setActionSuccessMsg(`Ticket #${ticket.id} resolved with standard template.`);
    setTimeout(() => setActionSuccessMsg(""), 3000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this feedback ticket?")) {
      onDeleteComplaint(id);
      setActionSuccessMsg(`Ticket #${id} removed.`);
      setTimeout(() => setActionSuccessMsg(""), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Feedback & Grievance Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Read, investigate, and reply to student complaints, bug reports, and course evaluations in real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onRefreshComplaints && (
            <button
              onClick={onRefreshComplaints}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Data</span>
            </button>
          )}

          {urgentCount > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-rose-500/20 animate-pulse">
              <Flame className="w-4 h-4" />
              <span>{urgentCount} Urgent Action Required</span>
            </div>
          )}
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Total Inbound Tickets</span>
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Logged across all student cohorts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Open & Unresolved</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{openCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting admin review</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Under Investigation</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{inProgressCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Active faculty review</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Resolved & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Feedback addressed with notes</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All Tickets ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus("OPEN")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "OPEN"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setFilterStatus("IN_PROGRESS")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "IN_PROGRESS"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterStatus("RESOLVED")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "RESOLVED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID, email, course, issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Secondary Category & Priority Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 dark:text-slate-400">Submitter:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Roles (Students & Teachers)</option>
              <option value="STUDENT">Students Only</option>
              <option value="TEACHER">Teachers & Faculty Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 dark:text-slate-400">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Course Content">Course Content & Videos</option>
              <option value="Teacher / Faculty">Faculty / Instructor</option>
              <option value="Technical / Platform Bug">Technical / Platform Bug</option>
              <option value="Assessment & Grades">Quizzes & Grades</option>
              <option value="Platform Suggestion">Platform Suggestion</option>
              <option value="General Feedback">General Feedback</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 dark:text-slate-400">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent Only</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {(filterStatus !== "ALL" || filterCategory !== "ALL" || filterPriority !== "ALL" || filterRole !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setFilterStatus("ALL");
                setFilterCategory("ALL");
                setFilterPriority("ALL");
                setFilterRole("ALL");
                setSearchQuery("");
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Ticket List Cards (High Legibility, Full Context) */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">All Clear! No Feedback Tickets Matching Filters</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              There are currently no active complaints or inquiries matching your search parameters.
            </p>
          </div>
        ) : (
          filteredComplaints.map((ticket) => {
            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
            const isInProgress = ticket.status === "IN_PROGRESS";
            const isExpanded = expandedMap[ticket.id] !== false; // default expanded for admin review
            const currentReplyText = replyTextMap[ticket.id] !== undefined ? replyTextMap[ticket.id] : (ticket.adminReply || "");
            const currentStatus = statusSelectMap[ticket.id] || ticket.status;

            return (
              <div
                key={ticket.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all shadow-sm overflow-hidden ${
                  ticket.priority === "Urgent" && !isResolved
                    ? "border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20"
                    : isResolved
                    ? "border-slate-200 dark:border-slate-800 opacity-90"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Top Ticket Header Bar */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <img
                      src={ticket.studentAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                      alt={ticket.studentName}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {ticket.studentName}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {ticket.studentOfficialId || ticket.studentId || "STU-ID"}
                        </span>
                        {ticket.studentEmail && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {ticket.studentEmail}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          {ticket.courseTitle || "General Platform"}
                        </span>
                        <span>•</span>
                        <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Recently logged"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges & Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {/* Category */}
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {ticket.category || "General Feedback"}
                    </span>

                    {/* Priority Badge */}
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border ${
                      ticket.priority === "Urgent"
                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                        : ticket.priority === "High"
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}>
                      {ticket.priority || "Medium"} Priority
                    </span>

                    {/* Status Pill */}
                    <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                      isResolved
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        : isInProgress
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                        : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                    }`}>
                      {isResolved ? "RESOLVED" : isInProgress ? "IN PROGRESS" : "OPEN"}
                    </span>

                    <button
                      onClick={() => toggleExpand(ticket.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Body Content: Student Issue (Crystal Clear Readability) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-5 bg-slate-50/40 dark:bg-slate-900/40">
                    {/* Student Complaint Text Box */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Student's Submitted Description
                        </span>
                        {ticket.rating && (
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                            <span>Rating:</span>
                            {"⭐".repeat(ticket.rating)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                        {ticket.issue}
                      </p>
                    </div>

                    {/* Admin Response & Resolution Console */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-indigo-600 text-white">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                            Administrator Resolution & Response Note
                          </span>
                        </div>

                        {/* Status Select */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status:</span>
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </div>
                      </div>

                      {/* Textarea for reply */}
                      <div>
                        <textarea
                          rows={3}
                          value={currentReplyText}
                          onChange={(e) => handleReplyChange(ticket.id, e.target.value)}
                          placeholder="Type your official administrative response or resolution summary to the student here..."
                          className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                        />
                      </div>

                      {/* Fast Action Templates */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Quick Templates:</span>
                        <button
                          type="button"
                          onClick={() => handleQuickResolve(ticket, "Thank you for alerting us. The course video/audio has been updated and replaced with a high-definition recording.")}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                        >
                          "Video Updated & Fixed"
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickResolve(ticket, "The faculty department has reviewed your assignment submission and updated the grading records.")}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                        >
                          "Grades Reviewed"
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickResolve(ticket, "Thank you for the constructive feedback! Our development team has patched this platform issue.")}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                        >
                          "Platform Patched"
                        </button>
                      </div>

                      {/* Action Submission Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                        <button
                          type="button"
                          onClick={() => handleDelete(ticket.id)}
                          className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Ticket</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveResolution(ticket)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Save Response & Update Status</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
