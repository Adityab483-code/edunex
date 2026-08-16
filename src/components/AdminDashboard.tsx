import React, { useState, useRef } from "react";
import { User, Course, SystemComplaint, AdminAnalytics, Role } from "../types";
import { UserAvatar } from "./UserAvatar";
import { 
  Users, 
  BookOpen, 
  ShieldCheck, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  BarChart2, 
  PieChart as PieIcon, 
  GraduationCap,
  Plus,
  Trash2,
  X,
  Fingerprint,
  Hash,
  RefreshCw,
  UserPlus,
  Mail,
  Lock,
  Upload,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

interface AdminDashboardProps {
  analytics: AdminAnalytics | null;
  users: User[];
  courses: Course[];
  complaints: SystemComplaint[];
  currentUser?: User;
  onApproveTeacher: (teacherId: string) => void;
  onDeleteUser?: (userId: string) => void;
  onCreateUser?: (newUser: User) => void;
  onUpdateComplaint?: (id: string, updates: { status?: string; adminReply?: string; adminName?: string }) => void;
  onDeleteComplaint?: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAiAssistant?: (mode?: string) => void;
}

const COLORS = ["#4f46e5", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b"];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  analytics,
  users = [],
  courses = [],
  complaints = [],
  currentUser,
  onApproveTeacher,
  onDeleteUser,
  onCreateUser,
  onUpdateComplaint,
  onDeleteComplaint,
  onNavigateTab,
  onOpenAiAssistant
}) => {
  const [userFilterRole, setUserFilterRole] = useState<string>("all");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Admin Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createRole, setCreateRole] = useState<Role>("TEACHER");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createId, setCreateId] = useState("");
  const [createDept, setCreateDept] = useState("Computer Science & AI");
  const [createAvatar, setCreateAvatar] = useState("");
  const [createError, setCreateError] = useState("");
  const createPhotoInputRef = useRef<HTMLInputElement>(null);

  const generateAdminCreateId = (role: Role) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = 2026;
    if (role === "TEACHER") {
      setCreateId(`TCH-${year}-${randomNum}`);
    } else if (role === "ADMIN") {
      setCreateId(`ADM-${year}-${randomNum}`);
    } else {
      setCreateId(`STD-${year}-${randomNum}`);
    }
  };

  const handleAdminCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!createName.trim() || !createEmail.trim()) {
      setCreateError("Please fill in user's name and email.");
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === createEmail.trim().toLowerCase());
    if (emailExists) {
      setCreateError("A user with this email address already exists.");
      return;
    }

    const customId = createId.trim();
    if (customId) {
      const idExists = users.some(u => u.id.toLowerCase() === customId.toLowerCase() || (u.officialId && u.officialId.toLowerCase() === customId.toLowerCase()));
      if (idExists) {
        setCreateError(`ID "${customId}" is already assigned to another user.`);
        return;
      }
    }

    const finalId = customId || (createRole === "TEACHER" ? `TCH-${Date.now()}` : createRole === "ADMIN" ? `ADM-${Date.now()}` : `usr-${Date.now()}`);

    const newUser: User = {
      id: finalId,
      officialId: customId || (createRole === "TEACHER" ? `TCH-${Math.floor(1000 + Math.random() * 9000)}` : createRole === "ADMIN" ? `ADM-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
      name: createName.trim(),
      email: createEmail.trim(),
      role: createRole,
      avatar: createAvatar,
      bio: `${createRole} account created by Administrator.`,
      enrolledCourseIds: createRole === "STUDENT" ? ["c-1", "c-2"] : [],
      goals: [createDept],
      xp: 100,
      department: createDept,
      approved: true
    };

    if (onCreateUser) {
      onCreateUser(newUser);
    }

    // Reset & Close
    setIsCreateModalOpen(false);
    setCreateName("");
    setCreateEmail("");
    setCreateId("");
    setCreateAvatar("");
    setCreateError("");
  };

  const filteredUsers = (users || []).filter((u) => {
    const matchesRole = userFilterRole === "all" || u.role.toLowerCase() === userFilterRole.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const pendingTeachers = users.filter(u => String(u.role).toUpperCase() === "TEACHER" && u.approved === false);

  const confirmDeleteUser = () => {
    if (!userToDelete || !onDeleteUser) return;
    onDeleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-indigo-400 border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Administration & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Director Control Center 🛡️
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Monitor real-time system analytics, approve faculty instructor requests, manage user permissions, and track platform health.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {onOpenAiAssistant && (
            <button
              onClick={() => onOpenAiAssistant("admin-intel")}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Gemini AI Intelligence & Ops</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab("users")}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Manage Accounts
          </button>
        </div>
      </div>

      {/* Primary KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Students Registered - Syncs live across all devices */}
        <div className="glass-card p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">Total Registered Students</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {users.filter(u => String(u.role).toUpperCase() === "STUDENT").length}
              </p>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Live Sync</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Faculty Teachers</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {users.filter(u => String(u.role).toUpperCase() === "TEACHER").length}
            </p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Courses</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{courses.length}</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg Completion Rate</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {analytics?.courseCompletionRate !== undefined ? `${analytics.courseCompletionRate}%` : "0%"}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Courses Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" /> Course Enrollment Metrics
            </h2>
            <span className="text-xs text-slate-400">Real-time Student Count</span>
          </div>

          <div className="h-64 w-full text-xs">
            {(!analytics?.popularCourses || analytics.popularCourses.length === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                No course enrollments recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.popularCourses}>
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
                  <Bar dataKey="enrolled" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Skill Growth Stats Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" /> Average Skill Mastery Velocity
            </h2>
            <span className="text-xs text-slate-400">By Domain</span>
          </div>

          <div className="h-64 w-full text-xs">
            {(!analytics?.skillGrowthStats || analytics.skillGrowthStats.length === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                No skill mastery metrics recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.skillGrowthStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="averageLevel" fill="#a855f7" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* User Accounts Management Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> User Accounts & Role Permissions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage students, faculty teachers, and administrators.</p>
          </div>

          {/* Search, Role Filters & Create Account Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search user..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <select
              value={userFilterRole}
              onChange={(e) => setUserFilterRole(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>

            <button
              onClick={() => {
                setCreateError("");
                setIsCreateModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <UserAvatar avatar={u.avatar} name={u.name} role={u.role} size="sm" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {u.officialId || u.id}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      String(u.role).toUpperCase() === "ADMIN"
                        ? "bg-slate-900 text-white"
                        : String(u.role).toUpperCase() === "TEACHER"
                        ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                        : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {u.department || u.title || "Standard Student"}
                  </td>
                  <td className="py-3 px-4">
                    {String(u.role).toUpperCase() === "TEACHER" ? (
                      u.approved !== false ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Pending Approval
                        </span>
                      )
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {String(u.role).toUpperCase() === "TEACHER" && u.approved === false && (
                        <button
                          onClick={() => onApproveTeacher(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                      )}

                      {/* Admin can delete Teacher and Student accounts */}
                      {String(u.role).toUpperCase() !== "ADMIN" ? (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-[10px] border border-rose-200 dark:border-rose-800/60 flex items-center gap-1 transition-all"
                          title={String(u.role).toUpperCase() === "STUDENT" ? "Delete student account (e.g. fake/spam)" : "Revoke & delete faculty account"}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete {String(u.role).toUpperCase() === "TEACHER" ? "Faculty" : "Account"}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          Primary Admin
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Confirm Account Deletion</h3>
                  <p className="text-[11px] text-slate-400">Administrative user revocation & purge</p>
                </div>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
              <UserAvatar avatar={userToDelete.avatar} name={userToDelete.name} role={userToDelete.role} size="md" />
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">{userToDelete.name}</div>
                <div className="text-[11px] text-slate-400">{userToDelete.email}</div>
                <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {userToDelete.role}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {String(userToDelete.role).toUpperCase() === "TEACHER" ? (
                <span>
                  Are you sure you want to permanently delete faculty account <strong>{userToDelete.name}</strong>? This will revoke instructor privileges and remove their associated course assignments from the active roster.
                </span>
              ) : (
                <span>
                  Are you sure you want to permanently delete student account <strong>{userToDelete.name}</strong>? This will remove all their enrollments, progress data, and profile records (ideal for removing fake or duplicate accounts).
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaints / User Feedback Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Platform Complaints & Inbound Feedback ({complaints.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time student submissions, technical bug reports, and course inquiries.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("complaints")}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto border border-indigo-200 dark:border-indigo-800"
          >
            <span>Open Full Feedback Hub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {complaints.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Complaints or Grievances Pending</p>
              <p className="text-[11px] text-slate-400">All submitted feedback has been reviewed and resolved.</p>
            </div>
          ) : (
            complaints.slice(0, 5).map((cmp) => {
              const isResolved = cmp.status === "RESOLVED" || cmp.status === "CLOSED";
              return (
                <div 
                  key={cmp.id} 
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isResolved
                      ? "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      : cmp.priority === "Urgent"
                      ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {cmp.courseTitle || "General Platform"}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {cmp.id}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                          isResolved 
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : cmp.status === "IN_PROGRESS"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                        }`}>
                          {cmp.status}
                        </span>
                        {cmp.priority && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            cmp.priority === "Urgent" 
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {cmp.priority} Priority
                          </span>
                        )}
                      </div>

                      {/* Complaint full text */}
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed mt-1">
                        {cmp.issue}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>Submitted by: <strong>{cmp.studentName}</strong> {cmp.studentOfficialId ? `(${cmp.studentOfficialId})` : ""}</span>
                        {cmp.createdAt && (
                          <span>• {new Date(cmp.createdAt).toLocaleDateString()}</span>
                        )}
                        {cmp.rating && (
                          <span>• {"⭐".repeat(cmp.rating)}</span>
                        )}
                      </div>

                      {/* If already replied, show admin note */}
                      {cmp.adminReply && (
                        <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200">
                          <span className="font-bold">Admin Response:</span> {cmp.adminReply}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-start">
                      {!isResolved && onUpdateComplaint && (
                        <button
                          type="button"
                          onClick={() => onUpdateComplaint(cmp.id, { 
                            status: "RESOLVED", 
                            adminReply: "Issue investigated and marked as resolved by Administrator.", 
                            adminName: currentUser?.name || "Administrator" 
                          })}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => onNavigateTab("complaints")}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                      >
                        Reply in Hub
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Admin Create New Account Modal with Enter ID Option */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create New User Account</h3>
                  <p className="text-[11px] text-slate-400">Register verified Faculty, Admin, or Student</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleAdminCreateSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateRole("TEACHER");
                      setCreateId("");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      createRole === "TEACHER"
                        ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Teacher / Faculty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreateRole("ADMIN");
                      setCreateId("");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      createRole === "ADMIN"
                        ? "bg-slate-900 dark:bg-slate-800 border-slate-900 text-white shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreateRole("STUDENT");
                      setCreateId("");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      createRole === "STUDENT"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student</span>
                  </button>
                </div>
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Dr. Emily Hayes"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="e.g. emily.h@university.edu"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dedicated Enter ID Option */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Fingerprint className={`w-3.5 h-3.5 ${
                      createRole === "TEACHER" 
                        ? "text-purple-600 dark:text-purple-400" 
                        : createRole === "ADMIN" 
                        ? "text-slate-900 dark:text-slate-100" 
                        : "text-indigo-500"
                    }`} />
                    <span>
                      {createRole === "TEACHER"
                        ? "Enter Faculty / Teacher ID"
                        : createRole === "ADMIN"
                        ? "Enter Admin Authorization / Staff ID"
                        : "Enter Student Roll / ID"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                      {createRole === "STUDENT" ? "Optional" : "Required / Preferred"}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => generateAdminCreateId(createRole)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    title="Generate standard formatted ID"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={createId}
                    onChange={(e) => setCreateId(e.target.value)}
                    placeholder={
                      createRole === "TEACHER"
                        ? "e.g. TCH-2026-9041 or FAC-102"
                        : createRole === "ADMIN"
                        ? "e.g. ADM-2026-003 or SEC-880"
                        : "e.g. STD-2026-4412 (optional)"
                    }
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Assigns official ID code for access cards, rosters, and administrative logs.
                </p>
              </div>

              {/* Department / Subject */}
              {createRole !== "ADMIN" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {createRole === "TEACHER" ? "Department / Faculty Subject" : "Major / Primary Specialization"}
                  </label>
                  <select
                    value={createDept}
                    onChange={(e) => setCreateDept(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Computer Science & AI">Computer Science & AI</option>
                    <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                    <option value="Cybersecurity & Cloud">Cybersecurity & Cloud</option>
                    <option value="Data Science & ML">Data Science & ML</option>
                    <option value="UI/UX Product Design">UI/UX Product Design</option>
                  </select>
                </div>
              )}

              {/* Custom Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Profile Photo (Optional)
                </label>
                <input
                  ref={createPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = (ev) => {
                      if (ev.target?.result) setCreateAvatar(ev.target.result as string);
                    };
                    r.readAsDataURL(f);
                  }}
                  className="hidden"
                />
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <UserAvatar avatar={createAvatar} name={createName || "User"} role={createRole} size="sm" />
                  <div className="flex-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {createAvatar ? "Custom photo attached" : "Initial monogram will be used"}
                  </div>
                  <button
                    type="button"
                    onClick={() => createPhotoInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                  {createAvatar && (
                    <button
                      type="button"
                      onClick={() => setCreateAvatar("")}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
