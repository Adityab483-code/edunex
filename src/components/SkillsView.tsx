import React, { useState } from "react";
import { Skill, Role, User } from "../types";
import { 
  Award, 
  Briefcase, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  Compass, 
  Search, 
  Zap, 
  BarChart3,
  ThumbsUp
} from "lucide-react";

interface SkillsViewProps {
  skills: Skill[];
  currentUser: User;
  userRole: Role;
  onOpenAiAssistant: () => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({
  skills,
  currentUser,
  userRole,
  onOpenAiAssistant
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Technical", "Communication", "Problem-Solving", "Leadership"];

  const filteredSkills = skills.filter(s => {
    const matchesCat = selectedCategory === "All" || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" /> Skill Matrix & Career Pathways
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track competency levels, analyze skill gaps, and explore targeted career role roadmaps.
          </p>
        </div>

        <button
          onClick={onOpenAiAssistant}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          AI Skill Gap Audit
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Skill Cards Grid */}
      {filteredSkills.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Skills Recorded Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enrolling in courses, submitting assignments, and completing quizzes will automatically calculate and track your skill proficiencies.
            </p>
          </div>
          <button
            onClick={onOpenAiAssistant}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Plan Career Roadmap with AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((sk) => (
            <div
              key={sk.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                  {sk.category}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Level {sk.level}%
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{sk.name}</h3>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-dual-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${sk.level}%` }}
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Career Roles
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(sk.targetRoles || []).map((role, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-indigo-500" /> {sk.endorsements || 0} Teacher Endorsements
                </span>
                <button
                  onClick={onOpenAiAssistant}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]"
                >
                  Improve Level →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Career Roadmap Widget */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold">Personalized AI Career Pathway</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Track course completions and portfolio milestones to generate individualized competency verification and industry readiness reports.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Step 1: Core Fundamentals</span>
            <p className="text-xs font-bold text-slate-300">Enroll & Complete Coursework</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Step 2: Practical Lab Application</span>
            <p className="text-xs font-bold text-amber-300">Submit Assignments & Quizzes</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Step 3: Capstone Portfolio</span>
            <p className="text-xs font-bold text-slate-400">Team Projects & Certification</p>
          </div>
        </div>
      </div>
    </div>
  );
};
