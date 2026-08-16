import React, { useState, useRef } from "react";
import { Role, User } from "../types";
import { UserAvatar } from "./UserAvatar";
import { EduNexLogo, EduNexLogoMark } from "./EduNexLogo";
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  UserCheck, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Award, 
  BrainCircuit, 
  Sun, 
  Moon,
  Zap,
  Upload,
  Camera,
  Trash2,
  Fingerprint,
  BadgeCheck,
  RefreshCw,
  Hash
} from "lucide-react";

interface AuthScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onSignUp: (newUser: User) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  users,
  onLogin,
  onSignUp,
  darkMode,
  onToggleDarkMode,
}) => {
  const [authMode, setAuthMode] = useState<"login" | "signup">(users.length === 0 ? "signup" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<Role>("STUDENT");
  const [signupFocus, setSignupFocus] = useState("Computer Science & AI");
  const [signupCustomId, setSignupCustomId] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const signupFileInputRef = useRef<HTMLInputElement>(null);

  const generatePresetId = (role: Role) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = 2026;
    if (role === "TEACHER") {
      setSignupCustomId(`TCH-${year}-${randomNum}`);
    } else if (role === "ADMIN") {
      setSignupCustomId(`ADM-${year}-${randomNum}`);
    } else {
      setSignupCustomId(`STD-${year}-${randomNum}`);
    }
  };

  const handleSignupPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg("Please choose a photo smaller than 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setSelectedAvatar(base64Url);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!loginEmail.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    const matched = users.find(
      (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (matched) {
      setSuccessMsg(`Welcome back, ${matched.name}! Logging you in...`);
      setTimeout(() => {
        onLogin(matched);
      }, 400);
    } else {
      if (users.length === 0) {
        setErrorMsg("No accounts registered yet. Please click 'Create New Account' above to register your student, teacher, or admin account.");
      } else {
        setErrorMsg("No account found with this email address. Please check your credentials or create a new account.");
      }
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    const existing = users.find(
      (u) => u.email.toLowerCase() === signupEmail.trim().toLowerCase()
    );
    if (existing) {
      setErrorMsg("An account with this email address already exists. Please sign in instead.");
      return;
    }

    const enteredId = signupCustomId.trim();

    // If custom ID entered, check if already in use
    if (enteredId) {
      const existingId = users.find(
        (u) => u.id.toLowerCase() === enteredId.toLowerCase() || 
               (u.officialId && u.officialId.toLowerCase() === enteredId.toLowerCase())
      );
      if (existingId) {
        setErrorMsg(`ID "${enteredId}" is already assigned to another account. Please enter a unique ID.`);
        return;
      }
    }

    const assignedId = enteredId ? enteredId : `usr-${Date.now()}`;

    const newUser: User = {
      id: assignedId,
      officialId: enteredId || (signupRole === "TEACHER" ? `TCH-${Math.floor(1000 + Math.random() * 9000)}` : signupRole === "ADMIN" ? `ADM-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
      name: signupName.trim(),
      email: signupEmail.trim(),
      role: signupRole,
      avatar: selectedAvatar,
      bio: signupRole === "ADMIN" ? "Platform Administrator account with full system governance." : `${signupRole} account in ${signupFocus}.`,
      enrolledCourseIds: signupRole === "STUDENT" ? ["c-1", "c-2"] : [],
      goals: signupRole === "ADMIN" ? ["Platform Governance", "System Administration"] : [signupFocus],
      xp: 100,
      department: signupRole === "ADMIN" ? "System Administration" : signupFocus,
      approved: true
    };

    setSuccessMsg(`Account created for ${newUser.name} (${newUser.role})! Entering platform...`);
    setTimeout(() => {
      onSignUp(newUser);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Bar with Brand and Dark Mode Toggle */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <EduNexLogo size="md" variant="full" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Grid */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero & Feature Highlights (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI-Powered Adaptive Learning & Skill Development</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Unlock Your Potential with <span className="text-indigo-600 dark:text-indigo-400">Intelligent Education</span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Connect students, instructors, and administrators in a collaborative ecosystem featuring AI Socratic tutoring, project milestone reviews, verifiable certificates, and automated grading.
              </p>
            </div>

            {/* Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Socratic Assistant</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Instant hints, code reviews, and customized quiz generation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Collaborative Project Hub</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Milestone checklists, peer team formation, and repo links.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Verifiable Certificates & Skills</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Skill mastery radar and certified proof of course completion.</p>
                </div>
              </div>
            </div>

            {/* Account Setup Info Card */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Create Your Own Custom Accounts:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 shadow-xs text-left">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">🎓 Student</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Learn, submit code & earn skills</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 shadow-xs text-left">
                  <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">👨‍🏫 Teacher</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Publish courses & grade students</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-left">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">🛡️ Admin</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">System control & user management</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Auth Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 space-y-6">
              
              {/* Auth Mode Toggle Tabs */}
              <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    authMode === "login"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Sign In to Account
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    authMode === "signup"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Create New Account
                </button>
              </div>

              {/* Status feedback alerts */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* SIGN IN FORM */}
              {authMode === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. alex.m@edunex.edu"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-500" />
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Password reset link sent to your registered email.")}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Remember this session</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2"
                  >
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("signup")}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Register for free
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* SIGN UP FORM */}
              {authMode === "signup" && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  
                  {/* Role Selector Card Grid */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Select Your Platform Role
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSignupRole("STUDENT")}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          signupRole === "STUDENT"
                            ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <BookOpen className={`w-4 h-4 mb-1.5 ${signupRole === "STUDENT" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`} />
                        <div className="text-xs font-bold">Student</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Learn & Build</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignupRole("TEACHER")}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          signupRole === "TEACHER"
                            ? "bg-purple-50/90 dark:bg-purple-950/60 border-purple-600 dark:border-purple-400 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/30"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <UserCheck className={`w-4 h-4 mb-1.5 ${signupRole === "TEACHER" ? "text-purple-600 dark:text-purple-400" : "text-slate-500"}`} />
                        <div className="text-xs font-bold">Teacher</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Instruct & Grade</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignupRole("ADMIN")}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          signupRole === "ADMIN"
                            ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-white text-white dark:text-slate-900 ring-2 ring-slate-400"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <ShieldCheck className={`w-4 h-4 mb-1.5 ${signupRole === "ADMIN" ? "text-white dark:text-slate-900" : "text-slate-500"}`} />
                        <div className="text-xs font-bold">Admin</div>
                        <div className="text-[10px] opacity-80 leading-tight mt-0.5">Manage Platform</div>
                      </button>
                    </div>
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Jordan Hayes"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="jordan.h@edunex.edu"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Password & Focus Row */}
                  <div className={`grid grid-cols-1 ${signupRole === "ADMIN" ? "" : "sm:grid-cols-2"} gap-3 text-left`}>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-500" />
                        Create Password
                      </label>
                      <input
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {signupRole !== "ADMIN" && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {signupRole === "TEACHER" ? "Department / Subject" : "Major / Primary Interest"}
                        </label>
                        <select
                          value={signupFocus}
                          onChange={(e) => setSignupFocus(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Computer Science & AI">Computer Science & AI</option>
                          <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                          <option value="Cybersecurity & Cloud">Cybersecurity & Cloud</option>
                          <option value="Data Science & ML">Data Science & ML</option>
                          <option value="UI/UX Product Design">UI/UX Product Design</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Dedicated Enter ID Option for Teacher & Admin (and Student) */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Fingerprint className={`w-3.5 h-3.5 ${
                          signupRole === "TEACHER" 
                            ? "text-purple-600 dark:text-purple-400" 
                            : signupRole === "ADMIN" 
                            ? "text-slate-900 dark:text-slate-100" 
                            : "text-indigo-500"
                        }`} />
                        <span>
                          {signupRole === "TEACHER"
                            ? "Faculty / Teacher ID"
                            : signupRole === "ADMIN"
                            ? "Admin Authorization / Staff ID"
                            : "Student Roll / ID Number"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          signupRole === "TEACHER"
                            ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                            : signupRole === "ADMIN"
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {signupRole === "STUDENT" ? "Optional" : "Institutional ID"}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => generatePresetId(signupRole)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        title="Auto-generate standard formatted ID"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Auto-Generate</span>
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Hash className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={signupCustomId}
                        onChange={(e) => setSignupCustomId(e.target.value)}
                        placeholder={
                          signupRole === "TEACHER"
                            ? "e.g. TCH-2026-104 or FAC-8842 (or your institution ID)"
                            : signupRole === "ADMIN"
                            ? "e.g. ADM-2026-001 or SEC-9921 (or your staff ID)"
                            : "e.g. STD-2026-8910 (optional)"
                        }
                        className={`w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                          signupRole === "TEACHER"
                            ? "border-purple-200 dark:border-purple-800/60 focus:ring-purple-500"
                            : signupRole === "ADMIN"
                            ? "border-slate-300 dark:border-slate-700 focus:ring-slate-500"
                            : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                      {signupRole === "TEACHER" && "Enter your designated school/college faculty ID for staff verification & roster records."}
                      {signupRole === "ADMIN" && "Enter your official administrator staff ID or security authorization code."}
                      {signupRole === "STUDENT" && "You can optionally enter your student roll number or institutional student ID."}
                    </p>
                  </div>

                  {/* Profile Photo Upload Option */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Profile Photo (Optional)</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {selectedAvatar ? "Custom photo selected" : "Default initials will be used"}
                      </span>
                    </label>

                    <input
                      ref={signupFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSignupPhotoUpload}
                      className="hidden"
                    />

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatar={selectedAvatar}
                          name={signupName || "New User"}
                          role={signupRole}
                          size="md"
                        />
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {selectedAvatar ? "Custom Photo Attached" : "Monogram Initials"}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {selectedAvatar ? "Visible on your account" : "You can upload or change anytime"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => signupFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{selectedAvatar ? "Change" : "Add Photo"}</span>
                        </button>

                        {selectedAvatar && (
                          <button
                            type="button"
                            onClick={() => setSelectedAvatar("")}
                            className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 transition-all"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2"
                  >
                    <span>Create My Account & Enter</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-1 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("login")}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Sign in instead
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <div>© 2026 EduNex Education Inc. All rights reserved.</div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-slate-700 dark:hover:text-slate-300">Terms of Service</span>
          <span>•</span>
          <span className="hover:text-slate-700 dark:hover:text-slate-300">Academic Integrity</span>
        </div>
      </footer>
    </div>
  );
};
