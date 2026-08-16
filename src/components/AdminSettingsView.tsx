import React, { useState } from "react";
import { 
  Settings, 
  Shield, 
  Sliders, 
  Cpu, 
  Lock, 
  Database, 
  Bell, 
  Save, 
  CheckCircle2,
  RefreshCw,
  Sparkles
} from "lucide-react";

export const AdminSettingsView: React.FC = () => {
  const [platformName, setPlatformName] = useState("EduNex Global Platform");
  const [aiPlagiarismSensitivity, setAiPlagiarismSensitivity] = useState(85);
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);
  const [requireTeacherApproval, setRequireTeacherApproval] = useState(true);
  const [defaultTerm, setDefaultTerm] = useState("Fall 2026 Cohort");
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(50);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" /> Platform Security & System Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure system-wide academic parameters, automated AI thresholds, and institutional security controls.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Institution Config */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" /> Institution & Academic Defaults
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Platform Brand Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Active Academic Cohort
              </label>
              <input
                type="text"
                value={defaultTerm}
                onChange={(e) => setDefaultTerm(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" /> Access Control & Verification Rules
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Require Admin Approval for Teacher Registrations</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Newly registered faculty instructors remain pending until verified by an Administrator.</span>
              </div>
              <input
                type="checkbox"
                checked={requireTeacherApproval}
                onChange={(e) => setRequireTeacherApproval(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Allow Public Student Sign-Ups</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Permit prospective learners to register self-service student accounts.</span>
              </div>
              <input
                type="checkbox"
                checked={allowPublicRegistration}
                onChange={(e) => setAllowPublicRegistration(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* AI & Plagiarism Automation */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" /> AI Grading & Integrity Thresholds
          </h2>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                AI Plagiarism Alert Threshold ({aiPlagiarismSensitivity}%)
              </label>
              <span className="text-xs text-slate-400">Submissions scoring above this flag for teacher manual review</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={aiPlagiarismSensitivity}
              onChange={(e) => setAiPlagiarismSensitivity(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
