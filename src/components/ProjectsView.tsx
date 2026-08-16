import React, { useState } from "react";
import { Project, Role, User } from "../types";
import { UserAvatar } from "./UserAvatar";
import { 
  Rocket, 
  Users, 
  CheckSquare, 
  ExternalLink, 
  Plus, 
  X, 
  Send, 
  Sparkles, 
  UserPlus, 
  Calendar, 
  Layers, 
  FolderGit2 
} from "lucide-react";

interface ProjectsViewProps {
  projects: Project[];
  currentUser: User;
  userRole: Role;
  onJoinProject: (projectId: string) => void;
  onCreateProject: (project: Partial<Project>) => void;
  onOpenAiAssistant: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentUser,
  userRole,
  onJoinProject,
  onCreateProject,
  onOpenAiAssistant
}) => {
  const isStudent = String(userRole).toUpperCase() === "STUDENT";
  const isTeacher = String(userRole).toUpperCase() === "TEACHER";
  const isAdmin = String(userRole).toUpperCase() === "ADMIN";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Web Dev");
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [newDemoUrl, setNewDemoUrl] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onCreateProject({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      repoUrl: newRepoUrl || "https://github.com/edunex/team-project",
      demoUrl: newDemoUrl || "https://edunex-demo.app",
      members: [
        { studentId: currentUser.id, studentName: currentUser.name, studentAvatar: currentUser.avatar }
      ],
      milestones: [
        { id: `m-${Date.now()}-1`, title: "Architecture & Wireframes", completed: true },
        { id: `m-${Date.now()}-2`, title: "API Development & Integration", completed: false },
        { id: `m-${Date.now()}-3`, title: "Testing & Deployment", completed: false }
      ]
    });

    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Rocket className="w-6 h-6 text-indigo-600" /> Collaborative Project & Portfolio Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Build real-world team projects, track milestone completion, and showcase verified portfolio projects to employers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Propose Team Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <FolderGit2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Collaborative Projects Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Start a project, break down technical milestones, share GitHub repositories, and collaborate with peers.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Propose First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const isMember = proj.members.some(m => m.studentId === currentUser.id);
            const completedMilestones = proj.milestones.filter(m => m.completed).length;
            const totalMilestones = proj.milestones.length || 1;
            const progressPct = Math.round((completedMilestones / totalMilestones) * 100);

            return (
              <div
                key={proj.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                      {proj.category}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{progressPct}% Complete</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{proj.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-dual-accent h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Milestones Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project Milestones</span>
                    {proj.milestones.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckSquare className={`w-3.5 h-3.5 ${m.completed ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`} />
                        <span className={m.completed ? "line-through opacity-70" : ""}>{m.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Members List */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Team Collaborators</span>
                    <div className="flex items-center gap-2">
                      {proj.members.map((m, idx) => (
                        <UserAvatar
                          key={idx}
                          avatar={m.studentAvatar}
                          name={m.studentName}
                          role="STUDENT"
                          size="xs"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {proj.demoUrl && (
                      <a
                        href={proj.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Demo Link
                      </a>
                    )}
                  </div>

                  {!isMember ? (
                    <button
                      onClick={() => onJoinProject(proj.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Join Team
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ You are a team contributor
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Propose Collaborative Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., AI Health Tracker App"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Goals, target tech stack, team roles..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">GitHub Repository Link</label>
                <input
                  type="url"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://github.com/team/repo"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md mt-2"
              >
                Launch Project Page
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
