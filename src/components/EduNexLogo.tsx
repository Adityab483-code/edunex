import React from "react";

interface EduNexLogoProps {
  variant?: "full" | "compact" | "mark";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  showTagline?: boolean;
}

export const EduNexLogoMark: React.FC<{ className?: string; size?: number }> = ({ 
  className = "", 
  size = 40 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
      aria-label="EduNex Icon"
    >
      <defs>
        {/* Navy Left Book Gradient */}
        <linearGradient id="edunex-navy-grad" x1="20" y1="40" x2="80" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B2754" />
          <stop offset="100%" stopColor="#103B7B" />
        </linearGradient>

        {/* Periwinkle Right Book Gradient */}
        <linearGradient id="edunex-peri-grad" x1="80" y1="40" x2="140" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6C88F7" />
          <stop offset="100%" stopColor="#5570ED" />
        </linearGradient>

        {/* Floating Digital Pixel 1 */}
        <linearGradient id="edunex-pixel-1" x1="100" y1="30" x2="114" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7E9AFF" />
          <stop offset="100%" stopColor="#5B77F4" />
        </linearGradient>

        {/* Floating Digital Pixel 2 */}
        <linearGradient id="edunex-pixel-2" x1="120" y1="36" x2="136" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#92A9FF" />
          <stop offset="100%" stopColor="#6985FB" />
        </linearGradient>

        {/* Floating Digital Pixel 3 */}
        <linearGradient id="edunex-pixel-3" x1="106" y1="52" x2="120" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6682F8" />
          <stop offset="100%" stopColor="#4A65E6" />
        </linearGradient>
      </defs>

      {/* Central Scholar Head / Circle */}
      <circle cx="80" cy="46" r="11" fill="#0B2754" />

      {/* Left Page (Navy Blue Wing) */}
      <path
        d="M78 61 C 65 52, 45 49, 26 50 C 25.5 50, 25 50.5, 25 51 L 25 106 C 25 106.6, 25.4 107, 26 107 C 45 106, 65 111, 78 124 L 78 61 Z"
        fill="url(#edunex-navy-grad)"
      />

      {/* Left Page Bottom Arc Ribbon */}
      <path
        d="M28 111 C 45 110.5, 63 115, 75 125.5"
        stroke="#0B2754"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Right Page (Periwinkle Blue with Digital Cutouts) */}
      <path
        d="M82 61 L 82 124 C 95 111, 115 106, 134 107 C 134.6 107, 135 106.6, 135 106 L 135 73 L 122 73 L 122 60 L 106 60 L 106 53 C 97 50.5, 89 54, 82 61 Z"
        fill="url(#edunex-peri-grad)"
      />

      {/* Right Page Bottom Arc Ribbon */}
      <path
        d="M85 125.5 C 97 115, 115 110.5, 132 111"
        stroke="#6C88F7"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Digital Floating Pixel Blocks Top Right */}
      {/* Topmost Pixel */}
      <rect x="110" y="32" width="10" height="10" rx="1.5" fill="url(#edunex-pixel-1)" />
      
      {/* Upper Right Pixel */}
      <rect x="123" y="39" width="12" height="12" rx="1.5" fill="url(#edunex-pixel-2)" />
      
      {/* Lower Pixel Matrix */}
      <rect x="110" y="47" width="11" height="11" rx="1.5" fill="url(#edunex-pixel-3)" />
      
      {/* Embedded Pixel on Right Book Corner */}
      <rect x="122" y="60" width="13" height="13" rx="1.5" fill="#7E9AFF" />
    </svg>
  );
};

export const EduNexLogo: React.FC<EduNexLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  showTagline = true
}) => {
  const getDimensions = () => {
    switch (size) {
      case "xs":
        return { iconSize: 24, textClass: "text-base", subClass: "text-[7px] tracking-[0.2em]" };
      case "sm":
        return { iconSize: 32, textClass: "text-lg", subClass: "text-[8px] tracking-[0.22em]" };
      case "md":
        return { iconSize: 42, textClass: "text-2xl", subClass: "text-[9px] tracking-[0.24em]" };
      case "lg":
        return { iconSize: 56, textClass: "text-3xl", subClass: "text-[10px] tracking-[0.26em]" };
      case "xl":
        return { iconSize: 72, textClass: "text-4xl", subClass: "text-xs tracking-[0.28em]" };
      case "hero":
        return { iconSize: 96, textClass: "text-5xl sm:text-6xl", subClass: "text-xs sm:text-sm tracking-[0.3em]" };
      default:
        return { iconSize: 42, textClass: "text-2xl", subClass: "text-[9px] tracking-[0.24em]" };
    }
  };

  const { iconSize, textClass, subClass } = getDimensions();

  if (variant === "mark") {
    return <EduNexLogoMark size={iconSize} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* Logo Icon Mark */}
      <div className="relative flex items-center justify-center p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-xs group-hover:shadow-md transition-all duration-300">
        <EduNexLogoMark size={iconSize} />
      </div>

      {/* Typography Stack */}
      <div className="flex flex-col justify-center">
        {/* Main "edunex" Wordmark */}
        <div className={`font-extrabold tracking-tight leading-none ${textClass} flex items-center font-sans`}>
          <span className="text-[#0B2754] dark:text-[#93C5FD]">edu</span>
          <span className="text-[#5570ED] dark:text-[#818CF8]">nex</span>
        </div>

        {/* Subtitle / Tagline */}
        {(variant === "full" && showTagline) && (
          <span className={`font-semibold uppercase text-[#334155] dark:text-slate-400 mt-1 leading-none ${subClass}`}>
            Smart Digital Learning Platform
          </span>
        )}
      </div>
    </div>
  );
};
