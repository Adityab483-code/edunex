import React, { useState, useRef } from "react";
import { User, Role } from "../types";
import { UserAvatar } from "./UserAvatar";
import { 
  User as UserIcon, 
  Mail, 
  Award, 
  BookOpen, 
  Camera, 
  Trash2, 
  Upload, 
  Sparkles, 
  Edit3, 
  CheckCircle2,
  Lock,
  Layers,
  GraduationCap,
  Image as ImageIcon
} from "lucide-react";

interface ProfileViewProps {
  currentUser: User;
  userRole: Role;
  onUpdateBio?: (newBio: string) => void;
  onUpdateAvatar?: (newAvatar: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  userRole,
  onUpdateBio,
  onUpdateAvatar
}) => {
  const [bioText, setBioText] = useState(currentUser.bio || "Passionate learner on the EduNex platform.");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBio) {
      onUpdateBio(bioText);
    }
    setIsEditingBio(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("Please choose an image smaller than 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url && onUpdateAvatar) {
        onUpdateAvatar(base64Url);
        setPhotoNotice("Custom profile photo uploaded successfully!");
        setTimeout(() => setPhotoNotice(null), 3000);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-uploaded if needed
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    if (onUpdateAvatar) {
      onUpdateAvatar("");
      setPhotoNotice("Profile photo removed. Switched to monogram initials.");
      setTimeout(() => setPhotoNotice(null), 3000);
    }
  };

  const isStudent = String(userRole).toUpperCase() === "STUDENT";
  const isTeacher = String(userRole).toUpperCase() === "TEACHER";
  const isAdmin = String(userRole).toUpperCase() === "ADMIN";

  const hasCustomPhoto = Boolean(currentUser.avatar && currentUser.avatar.trim().length > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Hidden File Input for Profile Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
        id="profile-photo-upload"
      />

      {/* Profile Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          
          {/* Avatar with Interactive Upload Trigger */}
          <div 
            className="relative group cursor-pointer"
            onMouseEnter={() => setIsHoveringPhoto(true)}
            onMouseLeave={() => setIsHoveringPhoto(false)}
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload your own profile photo"
          >
            <UserAvatar
              avatar={currentUser.avatar}
              name={currentUser.name}
              role={currentUser.role}
              size="2xl"
              className="ring-4 ring-white/30 shadow-2xl transition-transform duration-200 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 rounded-3xl bg-slate-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
              <Camera className="w-6 h-6 mb-1 text-white" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Change Photo</span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-amber-300">
              {isStudent && "🎓 Student Account"}
              {isTeacher && "👨‍🏫 Faculty Instructor"}
              {isAdmin && "🛡️ Platform Administrator"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentUser.name}
            </h1>
            <p className="text-xs text-indigo-100 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {currentUser.email}
            </p>

            {/* Photo Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Photo</span>
              </button>

              {hasCustomPhoto && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 backdrop-blur-md text-rose-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-400/30 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Notice */}
      {photoNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{photoNotice}</span>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bio & Department Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600" /> Academic Profile & Biography
            </h2>
            {!isEditingBio && (
              <button
                onClick={() => setIsEditingBio(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Bio
              </button>
            )}
          </div>

          {savedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Profile bio updated!
            </div>
          )}

          {isEditingBio ? (
            <form onSubmit={handleSaveBio} className="space-y-3">
              <textarea
                rows={3}
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBio(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {bioText}
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">
                {isAdmin ? "Admin Authorization ID:" : isTeacher ? "Faculty Staff ID:" : "Student Roll / ID:"}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                {currentUser.officialId || currentUser.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Department / Specialization:</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentUser.department || "Computer Science"}</span>
            </div>
            {isStudent && (
              <div className="flex justify-between">
                <span className="text-slate-400">Current Experience:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentUser.xp || 100} XP</span>
              </div>
            )}
          </div>
        </div>

        {/* Photo Management & Profile Settings Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-600" /> 
            Profile Picture & Appearance
          </h2>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatar={currentUser.avatar}
                name={currentUser.name}
                role={currentUser.role}
                size="lg"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {hasCustomPhoto ? "Custom Photo Active" : "Default Initials Badge"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {hasCustomPhoto 
                    ? "Your custom photo is visible to peers, teachers, and admins." 
                    : "No photo uploaded. Using clean initials badge across the platform."}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Photo</span>
              </button>

              {hasCustomPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  title="Remove picture and use monogram avatar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Learning Goals or Teaching Areas */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              {isStudent ? "Tracked Learning Goals" : "Department Faculty Expertise"}
            </div>
            {(currentUser.goals || [
              "Master Full-Stack TypeScript & React",
              "AI & Machine Learning Model Integration",
              "Production Cloud Architecture"
            ]).map((goal, index) => (
              <div
                key={index}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200"
              >
                <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
                <span className="truncate">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
