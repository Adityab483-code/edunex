import React, { useState } from "react";
import { Role, User, AppNotification } from "../types";
import { UserAvatar } from "./UserAvatar";
import { EduNexLogo } from "./EduNexLogo";
import { 
  GraduationCap, 
  Sun, 
  Moon, 
  Bell, 
  Search, 
  Sparkles, 
  UserCheck, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle,
  Menu,
  X,
  LogOut
} from "lucide-react";

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  currentUser: User;
  users: User[];
  onUserSwitch: (user: User) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAiAssistant: () => void;
  notifications: AppNotification[];
  onToggleSidebarMobile: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  users,
  onUserSwitch,
  darkMode,
  onToggleDarkMode,
  onOpenAiAssistant,
  notifications,
  onToggleSidebarMobile,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Exclude feedback and complaint notifications from general navbar notification center
  const displayNotifications = (notifications || []).filter(n => {
    if (n.type === "support") return false;
    const titleLower = (n.title || "").toLowerCase();
    const msgLower = (n.message || "").toLowerCase();
    if (titleLower.includes("feedback") || titleLower.includes("complaint") || titleLower.includes("grievance") || titleLower.includes("ticket")) return false;
    if (msgLower.includes("feedback ticket") || msgLower.includes("complaint ticket")) return false;
    return true;
  });

  const unreadNotifs = displayNotifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left branding & mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center">
          <EduNexLogo size="sm" variant="full" />
        </div>
      </div>

      {/* Authenticated Role Status Badge */}
      <div className="hidden md:flex items-center">
        {String(currentRole).toUpperCase() === "STUDENT" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>🎓 Student Workspace</span>
          </div>
        )}
        {String(currentRole).toUpperCase() === "TEACHER" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>👨‍🏫 Faculty Teacher Portal</span>
          </div>
        )}
        {String(currentRole).toUpperCase() === "ADMIN" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white text-xs font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>🛡️ Platform Administrator</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Assistant Button */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all shadow-sm"
          title="Open Smart AI Learning Assistant"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotifs}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{displayNotifications.length} Total</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 mt-1">
                {displayNotifications.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No recent notifications</p>
                ) : (
                  displayNotifications.map((n) => (
                    <div key={n.id} className="py-2 px-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{n.title}</div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {n.timeAgo || "Just now"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <UserAvatar
              avatar={currentUser.avatar}
              name={currentUser.name}
              role={currentUser.role}
              size="sm"
            />
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold capitalize">{currentUser.role}</div>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50">
              <div className="px-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
              </div>

              <div className="py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                  {users.length > 1 ? "Switch Registered Account" : "Active Profile"}
                </p>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onUserSwitch(u);
                      onRoleChange(u.role);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                      u.id === currentUser.id
                        ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar avatar={u.avatar} name={u.name} role={u.role} size="xs" />
                      <span className="truncate">{u.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 uppercase font-semibold">{u.role}</span>
                  </button>
                ))}
              </div>

              {onLogout && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create / Switch Account</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
