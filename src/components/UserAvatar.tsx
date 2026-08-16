import React, { useState } from "react";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string;
  role?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  ring?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name = "User",
  role,
  size = "md",
  className = "",
  ring = true
}) => {
  const [imageError, setImageError] = useState(false);

  // Extract up to 2 uppercase initials from the name
  const getInitials = (fullName: string) => {
    if (!fullName || !fullName.trim()) return "U";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // Derive theme colors based on role or name hash
  const getRoleGradient = () => {
    const roleUpper = String(role || "").toUpperCase();
    if (roleUpper === "ADMIN") {
      return "from-slate-700 via-slate-800 to-slate-900 text-amber-300 ring-slate-400/40";
    }
    if (roleUpper === "TEACHER") {
      return "from-purple-600 via-indigo-600 to-violet-700 text-white ring-purple-400/40";
    }
    // Student or default
    return "from-indigo-600 via-blue-600 to-indigo-800 text-white ring-indigo-400/40";
  };

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px] rounded-md",
    sm: "w-7 h-7 text-[11px] font-bold rounded-lg",
    md: "w-9 h-9 text-xs font-bold rounded-xl",
    lg: "w-12 h-12 text-sm font-extrabold rounded-2xl",
    xl: "w-16 h-16 text-lg font-extrabold rounded-3xl",
    "2xl": "w-24 h-24 text-2xl font-black rounded-3xl"
  };

  const ringClass = ring ? "ring-2 ring-white/20 shadow-xs" : "";
  const baseSize = sizeClasses[size] || sizeClasses.md;

  const hasValidAvatar = Boolean(avatar && avatar.trim() && !imageError);

  if (hasValidAvatar) {
    return (
      <img
        src={avatar!}
        alt={name}
        onError={() => setImageError(true)}
        className={`${baseSize} object-cover ${ringClass} ${className} shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${baseSize} bg-gradient-to-tr ${getRoleGradient()} ${ringClass} ${className} flex items-center justify-center font-bold tracking-wider select-none shrink-0`}
      title={name}
      aria-label={name}
    >
      <span>{initials}</span>
    </div>
  );
};
