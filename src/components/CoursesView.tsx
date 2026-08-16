import React, { useState, useRef } from "react";
import { Course, CourseResource, Lesson, Role, User } from "../types";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Star, 
  Clock, 
  Users, 
  PlayCircle, 
  FileText, 
  Download, 
  X,
  Trash2,
  Upload,
  Film,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  Sparkles,
  Layers
} from "lucide-react";
import { uploadCourseFile } from "../lib/api";

interface CoursesViewProps {
  courses: Course[];
  currentUser: User;
  userRole: Role;
  onEnroll: (courseId: string) => void;
  onCreateCourse: (course: Partial<Course>) => void;
  onDeleteCourse?: (courseId: string) => void;
  onOpenAiAssistant: () => void;
  onCompleteCourseAndTakeQuiz?: (course: Course) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  currentUser,
  userRole,
  onEnroll,
  onCreateCourse,
  onDeleteCourse,
  onOpenAiAssistant,
  onCompleteCourseAndTakeQuiz
}) => {
  const isTeacher = String(userRole).toUpperCase() === "TEACHER";
  const isAdmin = String(userRole).toUpperCase() === "ADMIN";
  const canManage = isTeacher || isAdmin;

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCourseModal, setActiveCourseModal] = useState<Course | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // New Course Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<any>("Technical");
  const [newLevel, setNewLevel] = useState<any>("Beginner");
  const [newDuration, setNewDuration] = useState("6 Weeks");
  const [skillsInput, setSkillsInput] = useState("");

  // Uploaded items state in creation modal
  const [uploadedResources, setUploadedResources] = useState<CourseResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["All", "Technical", "Soft Skills", "AI & Data", "Cybersecurity", "Design"];

  const filteredCourses = courses.filter((c) => {
    const matchesCat = selectedCategory === "All" || c.category === selectedCategory;
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle file uploads to SQLite database
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(`Processing ${files.length} file(s) for SQLite storage...`);

    const newUploadedList: CourseResource[] = [...uploadedResources];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Saving ${file.name} (${i + 1}/${files.length}) into SQLite3...`);

      try {
        const result = await uploadCourseFile(file, {
          title: file.name
        });

        if (result && result.file) {
          newUploadedList.push(result.file);
        }
      } catch (err: any) {
        console.error("Upload failed for file:", file.name, err);
        setUploadError(`Failed to save ${file.name} to SQLite. Please verify file size.`);
      }
    }

    setUploadedResources(newUploadedList);
    setIsUploading(false);
    setUploadProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveResource = (index: number) => {
    setUploadedResources(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const skillsArray = skillsInput
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    // Build default lessons, including uploaded videos as active video modules
    const defaultLessons: Lesson[] = [];
    const videoUploads = uploadedResources.filter(r => r.type === "video");
    
    if (videoUploads.length > 0) {
      videoUploads.forEach((vid, idx) => {
        defaultLessons.push({
          id: `l-${Date.now()}-${idx + 1}`,
          title: `Video Lecture ${idx + 1}: ${vid.title.replace(/\.[^/.]+$/, "")}`,
          duration: "15 mins",
          type: "video",
          summary: `Comprehensive walkthrough lesson covering ${vid.title}`,
          videoUrl: vid.url,
          fileName: vid.fileName,
          uploadId: vid.uploadId,
          completed: false
        });
      });
    }

    if (defaultLessons.length === 0) {
      defaultLessons.push({
        id: `l-${Date.now()}-1`,
        title: "Module 1: Foundations & Architecture",
        duration: "45 mins",
        type: "video",
        summary: "Introduction and core setup",
        completed: false
      });
    }

    onCreateCourse({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      level: newLevel,
      duration: newDuration,
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      instructorAvatar: currentUser.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      thumbnail: newCategory === "AI & Data" 
        ? "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80"
        : newCategory === "Cybersecurity"
        ? "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80"
        : newCategory === "Design"
        ? "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
      lessonsCount: defaultLessons.length,
      lessons: defaultLessons,
      resources: uploadedResources,
      skillsTaught: skillsArray.length > 0 ? skillsArray : ["Core Concepts", "Best Practices", "Hands-on Mastery"]
    });

    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
    setSkillsInput("");
    setUploadedResources([]);
  };

  const confirmDelete = () => {
    if (!courseToDelete || !onDeleteCourse) return;
    onDeleteCourse(courseToDelete.id);
    if (activeCourseModal?.id === courseToDelete.id) {
      setActiveCourseModal(null);
    }
    setCourseToDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" /> Academic & Skill Course Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explore peer-reviewed courses, practical coding labs, video lectures, and rich study resources.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create New Course
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses, videos, or PDFs..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Courses Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isTeacher || isAdmin 
                ? "Click 'Create New Course' to publish your first academic course with SQLite-backed videos, PDFs, and presentations."
                : "No courses are currently available in this category. Courses published by instructors will appear here."}
            </p>
          </div>
          {(isTeacher || isAdmin) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Create First Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = currentUser.enrolledCourseIds?.includes(course.id);
            const canDeleteCourse = isAdmin;
            const videosCount = (course.resources || []).filter(r => r.type === "video").length;
            const pdfsCount = (course.resources || []).filter(r => r.type === "pdf").length;
            const presCount = (course.resources || []).filter(r => r.type === "presentation").length;

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative h-44 overflow-hidden bg-slate-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/30" />
                    
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-bold">
                      {course.category}
                    </span>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-300 fill-amber-300" /> {course.rating}
                      </span>
                      {canDeleteCourse && onDeleteCourse && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCourseToDelete(course);
                          }}
                          title="Delete Course (SQLite database & storage)"
                          className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-700 text-white backdrop-blur-md transition-all shadow-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Resources Badges Overlay */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1.5 flex-wrap">
                      {videosCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs">
                          <Film className="w-2.5 h-2.5" /> {videosCount} Video{videosCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {pdfsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs">
                          <FileText className="w-2.5 h-2.5" /> {pdfsCount} PDF{pdfsCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {presCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-600/90 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs">
                          <Presentation className="w-2.5 h-2.5" /> {presCount} Slides
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{course.level}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrolledCount} Students</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(course.skillsTaught || []).slice(0, 3).map((sk, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={course.instructorAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"} 
                      alt={course.instructorName} 
                      className="w-6 h-6 rounded-full object-cover" 
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                      {course.instructorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEnrolled ? (
                      <button
                        onClick={() => onEnroll(course.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Enroll Now
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveCourseModal(course);
                          setActiveLessonId(course.lessons?.[0]?.id || null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Open Course
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Course</h3>
                <p className="text-xs text-slate-500">SQLite database & file cleanup</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white font-bold">"{courseToDelete.title}"</strong>? 
              This will remove all associated modules, enrolled records, and uploaded videos/PDFs from SQLite storage.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail / Video Player / Study Resources Modal */}
      {activeCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{activeCourseModal.category}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-400" /> SQLite3 Synchronized
                  </span>
                </div>
                <h2 className="text-lg font-bold">{activeCourseModal.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && onDeleteCourse && (
                  <button
                    onClick={() => setCourseToDelete(activeCourseModal)}
                    className="p-2 rounded-xl bg-red-600/30 text-red-300 hover:bg-red-600 hover:text-white transition-colors"
                    title="Delete Course (Admin Only)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setActiveCourseModal(null)}
                  className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 Cols): Active Lesson Player / Content View */}
              <div className="lg:col-span-2 space-y-4">
                {/* Active Lesson Display */}
                {(() => {
                  const currentLesson = activeCourseModal.lessons?.find(l => l.id === activeLessonId) || activeCourseModal.lessons?.[0];
                  const videoUrl = currentLesson?.videoUrl || activeCourseModal.resources?.find(r => r.type === "video")?.url;

                  return (
                    <div className="space-y-4">
                      {videoUrl ? (
                        <div className="w-full rounded-2xl bg-black overflow-hidden shadow-lg border border-slate-800">
                          <video 
                            controls 
                            src={videoUrl} 
                            className="w-full max-h-72 object-contain bg-black"
                            poster={activeCourseModal.thumbnail}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="w-full h-56 sm:h-64 rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-white relative overflow-hidden group">
                          <PlayCircle className="w-16 h-16 text-indigo-500 opacity-80 group-hover:scale-110 transition-transform cursor-pointer" />
                          <p className="text-xs text-slate-300 mt-2 font-semibold">
                            Module Lecture: {currentLesson?.title || "Overview"}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {currentLesson?.title || activeCourseModal.title}
                          </h3>
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                            {currentLesson?.duration || activeCourseModal.duration}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {currentLesson?.summary || activeCourseModal.description}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Uploaded Course Resources from SQLite */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" /> Course Files & SQLite Uploads
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {(activeCourseModal.resources || []).length} items attached
                    </span>
                  </div>

                  {(activeCourseModal.resources || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No additional PDF, presentation, or code attachments uploaded for this course.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(activeCourseModal.resources || []).map((res) => {
                        const isVideo = res.type === "video";
                        const isPdf = res.type === "pdf";
                        const isPres = res.type === "presentation";

                        return (
                          <div
                            key={res.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 hover:border-indigo-500 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isVideo ? "bg-purple-100 dark:bg-purple-950 text-purple-600" :
                                isPdf ? "bg-red-100 dark:bg-red-950 text-red-600" :
                                isPres ? "bg-amber-100 dark:bg-amber-950 text-amber-600" :
                                "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
                              }`}>
                                {isVideo ? <Film className="w-4 h-4" /> :
                                 isPdf ? <FileText className="w-4 h-4" /> :
                                 isPres ? <Presentation className="w-4 h-4" /> :
                                 <FileText className="w-4 h-4" />}
                              </div>

                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {res.title}
                                </p>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {res.size || "Resource"} • SQLite Stored
                                </span>
                              </div>
                            </div>

                            <a
                              href={res.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              download={res.fileName || res.title}
                              className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors shrink-0 shadow-xs"
                              title="Download / View File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Lessons List Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Syllabus Modules
                </h3>
                <div className="space-y-2">
                  {(activeCourseModal.lessons || []).map((lesson, idx) => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={`w-full text-left p-3 rounded-2xl border text-xs transition-all ${
                        activeLessonId === lesson.id || (!activeLessonId && idx === 0)
                          ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500 font-bold text-indigo-700 dark:text-indigo-300 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5">
                          {lesson.videoUrl ? <Film className="w-3 h-3 text-purple-600" /> : <PlayCircle className="w-3 h-3" />}
                          Lesson {idx + 1}
                        </span>
                        <span className="text-[10px] opacity-70">{lesson.duration}</span>
                      </div>
                      <div className="font-semibold">{lesson.title}</div>
                    </button>
                  ))}
                </div>

                {/* Course Completion & Final Assessment Quiz Action */}
                {String(userRole).toUpperCase() === "STUDENT" && onCompleteCourseAndTakeQuiz && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <button
                      onClick={() => {
                        const targetCourse = activeCourseModal;
                        setActiveCourseModal(null);
                        onCompleteCourseAndTakeQuiz(targetCourse);
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Course & Take Final Exam</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-medium">
                      🎯 Score 85%+ on the course quiz to autogenerate verified certificate
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal with SQLite Upload Engine */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> Create New Course
                </h2>
                <p className="text-xs text-slate-500">Upload videos, PDFs, presentations, and syllabus to SQLite3</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Full-Stack TypeScript & Cloud Microservices"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Course Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summarize course goals, curriculum takeaways, and target audience..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="AI & Data">AI & Data</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Design">Design</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Level</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Estimated Duration</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="e.g., 6 Weeks / 12 Hours"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Key Skills Taught (comma separated)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g., React 19, SQLite, REST APIs, System Design"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* UPLOAD SECTION: SQLite Video, PDF, Presentation, Picture & Note Storage */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Upload Course Media, Textbooks & Notes
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    High Capacity (Up to 1GB per file)
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Upload MP4/WebM/MOV 4K video lectures, complete PDF textbooks, PowerPoint/Keynote presentations, high-resolution pictures/diagrams, and markdown/text notes.
                </p>

                {/* Upload Button Box */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept=".mp4,.webm,.mov,.mkv,.avi,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.ppt,.pptx,.key,.zip,.docx,.doc,.txt,.md"
                    className="hidden"
                    id="course-file-upload-input"
                  />
                  <label
                    htmlFor="course-file-upload-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Select & Upload High-Capacity Files
                  </label>

                  {isUploading && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                      {uploadProgress}
                    </span>
                  )}
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Uploaded Files Table */}
                {uploadedResources.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Uploaded Resources ({uploadedResources.length}):
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {uploadedResources.map((res, index) => (
                        <div
                          key={res.id || index}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-700 text-indigo-600">
                              {res.type === "video" ? <Film className="w-3.5 h-3.5 text-purple-600" /> :
                               res.type === "pdf" ? <FileText className="w-3.5 h-3.5 text-red-600" /> :
                               res.type === "presentation" ? <Presentation className="w-3.5 h-3.5 text-amber-600" /> :
                               <FileText className="w-3.5 h-3.5" />}
                            </span>
                            <div className="truncate">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                                {res.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {res.size} • Type: {res.type} • SQLite Verified
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveResource(index)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
