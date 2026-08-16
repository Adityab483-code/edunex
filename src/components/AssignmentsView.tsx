import React, { useState, useRef } from "react";
import { Assignment, AssignmentAttachment, AssignmentSubmission, Course, Role, User } from "../types";
import { UserAvatar } from "./UserAvatar";
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Upload, 
  Sparkles, 
  X,
  Send,
  Award,
  Trash2,
  Image as ImageIcon,
  FileCheck,
  Eye,
  Download,
  ExternalLink,
  AlertCircle,
  ZoomIn,
  Paperclip,
  Check,
  Film,
  Users
} from "lucide-react";
import { uploadCourseFile } from "../lib/api";

interface AssignmentsViewProps {
  assignments: Assignment[];
  courses: Course[];
  currentUser: User;
  userRole: Role;
  onSubmitAssignment: (assignmentId: string, submission: any) => void;
  onGradeAssignment: (
    assignmentId: string, 
    submissionId: string, 
    grade: number, 
    feedback: string,
    gradedFileUrl?: string,
    gradedFileName?: string,
    gradedFileType?: "pdf" | "image" | "file"
  ) => void;
  onCreateAssignment: (assignment: Partial<Assignment>) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
  onOpenAiAssistant: () => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments = [],
  courses = [],
  currentUser,
  userRole,
  onSubmitAssignment,
  onGradeAssignment,
  onCreateAssignment,
  onDeleteAssignment,
  onOpenAiAssistant
}) => {
  const isStudent = String(userRole).toUpperCase() === "STUDENT";
  const isTeacher = String(userRole).toUpperCase() === "TEACHER";
  const isAdmin = String(userRole).toUpperCase() === "ADMIN";

  // Permission guards strictly per prompt:
  // - Only teacher can upload/create assignments
  // - Only admin can delete assignments (or courses)
  const canUploadAssignment = isTeacher;
  const canDeleteAssignment = isAdmin;

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Student file upload state
  const [studentUploadedFile, setStudentUploadedFile] = useState<{
    url: string;
    fileName: string;
    fileType: "pdf" | "image" | "file";
    size: string;
  } | null>(null);
  const [isUploadingStudentFile, setIsUploadingStudentFile] = useState(false);
  const [studentUploadError, setStudentUploadError] = useState<string | null>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  // Teacher Reviewing & Grading State
  const [selectedSubForGrade, setSelectedSubForGrade] = useState<{ assignmentId: string; sub: AssignmentSubmission } | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(90);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [teacherFeedbackFile, setTeacherFeedbackFile] = useState<{
    url: string;
    fileName: string;
    fileType: "pdf" | "image" | "file";
    size: string;
  } | null>(null);
  const [isUploadingTeacherFile, setIsUploadingTeacherFile] = useState(false);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);

  // Create Assignment State (Teachers Only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseId, setNewCourseId] = useState((courses || [])[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDeadline, setNewDeadline] = useState("2026-09-01");
  const [newTotalPoints, setNewTotalPoints] = useState<number>(100);

  // Teacher attachments during assignment creation
  const [teacherAttachments, setTeacherAttachments] = useState<AssignmentAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Assignment Confirmation Modal (Admin Only)
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  // Full-Screen Image Lightbox Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<{ url: string; title: string } | null>(null);

  // ==========================
  // Handlers for File Uploads
  // ==========================

  // Teacher uploading PDF / Photo attachments when creating assignment
  const handleTeacherAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
    setAttachmentError(null);

    const newAttachmentsList: AssignmentAttachment[] = [...teacherAttachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.toLowerCase();
      const isImg = ext.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/);
      const isPdf = ext.endsWith(".pdf");

      try {
        const result = await uploadCourseFile(file, {
          title: file.name,
          resourceType: isImg ? "image" : isPdf ? "pdf" : "file"
        });

        if (result && result.file) {
          newAttachmentsList.push({
            id: result.file.id || `att-${Date.now()}-${i}`,
            title: file.name,
            fileName: result.file.fileName || file.name,
            url: result.file.url,
            type: isImg ? "image" : isPdf ? "pdf" : "file",
            size: result.file.size,
            uploadId: result.file.uploadId
          });
        }
      } catch (err: any) {
        console.error("Failed to upload assignment attachment:", err);
        setAttachmentError(`Failed to upload ${file.name}. Please verify file size.`);
      }
    }

    setTeacherAttachments(newAttachmentsList);
    setIsUploadingAttachment(false);
    if (createFileInputRef.current) {
      createFileInputRef.current.value = "";
    }
  };

  const handleRemoveTeacherAttachment = (index: number) => {
    setTeacherAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Student uploading PDF / Photo when submitting assignment
  const handleStudentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStudentFile(true);
    setStudentUploadError(null);

    const ext = file.name.toLowerCase();
    const isImg = ext.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/);
    const isPdf = ext.endsWith(".pdf");

    try {
      const result = await uploadCourseFile(file, {
        title: `Submission_${currentUser.name}_${file.name}`,
        resourceType: isImg ? "image" : isPdf ? "pdf" : "file"
      });

      if (result && result.file) {
        setStudentUploadedFile({
          url: result.file.url,
          fileName: file.name,
          fileType: isImg ? "image" : isPdf ? "pdf" : "file",
          size: result.file.size || "File"
        });
      }
    } catch (err: any) {
      console.error("Student upload failed:", err);
      setStudentUploadError("Upload failed. Please try again with a valid PDF or Photo.");
    } finally {
      setIsUploadingStudentFile(false);
    }
  };

  // Teacher uploading graded review PDF / annotated Photo feedback
  const handleTeacherFeedbackFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTeacherFile(true);
    const ext = file.name.toLowerCase();
    const isImg = ext.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/);
    const isPdf = ext.endsWith(".pdf");

    try {
      const result = await uploadCourseFile(file, {
        title: `Graded_Feedback_${file.name}`,
        resourceType: isImg ? "image" : isPdf ? "pdf" : "file"
      });

      if (result && result.file) {
        setTeacherFeedbackFile({
          url: result.file.url,
          fileName: file.name,
          fileType: isImg ? "image" : isPdf ? "pdf" : "file",
          size: result.file.size || "File"
        });
      }
    } catch (err) {
      console.error("Teacher feedback file upload failed:", err);
    } finally {
      setIsUploadingTeacherFile(false);
    }
  };

  // ==========================
  // Form Submission Handlers
  // ==========================

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!submissionText.trim() && !studentUploadedFile && !repoUrl.trim()) {
      alert("Please provide submission notes, attach a PDF/Photo, or provide a repository link.");
      return;
    }

    onSubmitAssignment(selectedAssignment.id, {
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentAvatar: currentUser.avatar,
      content: submissionText,
      fileUrl: studentUploadedFile?.url || repoUrl || "",
      fileName: studentUploadedFile?.fileName,
      fileType: studentUploadedFile?.fileType,
      fileSize: studentUploadedFile?.size,
      attachments: studentUploadedFile ? [{
        id: `att-${Date.now()}`,
        title: studentUploadedFile.fileName,
        url: studentUploadedFile.url,
        type: studentUploadedFile.fileType,
        size: studentUploadedFile.size
      }] : []
    });

    setShowSubmitModal(false);
    setSubmissionText("");
    setRepoUrl("");
    setStudentUploadedFile(null);
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForGrade) return;

    onGradeAssignment(
      selectedSubForGrade.assignmentId,
      selectedSubForGrade.sub.id || selectedSubForGrade.sub.studentId,
      gradeInput,
      feedbackInput,
      teacherFeedbackFile?.url,
      teacherFeedbackFile?.fileName,
      teacherFeedbackFile?.fileType
    );

    setSelectedSubForGrade(null);
    setTeacherFeedbackFile(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const courseObj = courses.find(c => c.id === newCourseId);

    onCreateAssignment({
      courseId: newCourseId,
      courseTitle: courseObj?.title || "Academic Course",
      title: newTitle,
      description: newDesc,
      deadline: newDeadline,
      totalPoints: Number(newTotalPoints) || 100,
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      attachments: teacherAttachments
    });

    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
    setTeacherAttachments([]);
  };

  const confirmDeleteAssignment = () => {
    if (!assignmentToDelete || !onDeleteAssignment) return;
    onDeleteAssignment(assignmentToDelete.id);
    setAssignmentToDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> 
            Academic Assignments & Submissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload PDF problem sets, submit photos/diagrams, and evaluate coursework with full PDF & image support.
          </p>
        </div>

        {/* ONLY TEACHERS CAN UPLOAD / CREATE ASSIGNMENTS */}
        {canUploadAssignment && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Upload New Assignment
          </button>
        )}
      </div>

      {/* Assignments List */}
      {(!assignments || assignments.length === 0) ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Assignments Posted</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {canUploadAssignment 
                ? "Click 'Upload New Assignment' to attach PDF briefs, problem photos, and publish coursework for your students."
                : isAdmin
                ? "Instructors have not uploaded any assignments yet. As administrator, you have permission to delete any assignment or course across the platform."
                : "Your instructors have not published any assignments yet. Check back once courses begin."}
            </p>
          </div>
          {canUploadAssignment && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Upload First Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const userSub = (assignment.submissions || []).find(s => s.studentId === currentUser.id);
            const attachmentsList = assignment.attachments || [];

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 relative group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                        {assignment.courseTitle}
                      </span>
                      {assignment.instructorName && (
                        <span className="text-[10px] text-slate-400">
                          Instructor: {assignment.instructorName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {assignment.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Deadline: {assignment.deadline}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {assignment.totalPoints} Points
                    </span>

                    {/* ONLY ADMIN CAN DELETE ASSIGNMENTS FROM WEBSITE */}
                    {canDeleteAssignment && onDeleteAssignment && (
                      <button
                        onClick={() => setAssignmentToDelete(assignment)}
                        title="Delete Assignment (Admin Master Control)"
                        className="ml-2 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors shadow-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {assignment.description}
                </p>

                {/* TEACHER ATTACHMENTS (PDF & PHOTOS) */}
                {attachmentsList.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      Course Material & Attachments ({attachmentsList.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {attachmentsList.map((att) => {
                        const isPdf = att.type === "pdf";
                        const isImg = att.type === "image";

                        return (
                          <div
                            key={att.id}
                            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {isImg ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl({ url: att.url, title: att.title })}
                                  className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 relative group/img cursor-pointer"
                                  title="Click to expand photo"
                                >
                                  <img 
                                    src={att.url} 
                                    alt={att.title} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <ZoomIn className="w-3.5 h-3.5" />
                                  </div>
                                </button>
                              ) : (
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isPdf ? "bg-red-100 dark:bg-red-950 text-red-600" : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
                                }`}>
                                  {isPdf ? <FileText className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                                </div>
                              )}

                              <div className="overflow-hidden">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {att.title}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {att.size || (isPdf ? "PDF Document" : isImg ? "Photo Attachment" : "File")}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {isImg && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl({ url: att.url, title: att.title })}
                                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-xs"
                                  title="View Photo"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                download={att.fileName || att.title}
                                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors shadow-xs"
                                title={isPdf ? "Open / Download PDF" : "Download File"}
                              >
                                {isPdf ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STUDENT SUBMISSION SECTION & TEACHER GRADING QUEUE */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                  {isStudent ? (
                    userSub ? (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                              String(userSub.status).toUpperCase() === "GRADED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}>
                              <CheckCircle2 className="w-4 h-4" />
                              {String(userSub.status).toUpperCase() === "GRADED" 
                                ? `Graded: ${userSub.grade}/${assignment.totalPoints}` 
                                : "Submitted (Pending Review)"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Submitted: {userSub.submittedAt}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setSubmissionText(userSub.content || "");
                              setShowSubmitModal(true);
                            }}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline self-start sm:self-auto"
                          >
                            Resubmit Work
                          </button>
                        </div>

                        {/* Submitted Content / Attached Photo / PDF */}
                        {userSub.content && (
                          <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            <span className="font-bold block text-slate-900 dark:text-white mb-0.5">Your Submission:</span>
                            <p className="whitespace-pre-line">{userSub.content}</p>
                          </div>
                        )}

                        {/* Student Attached PDF / Photo Badge */}
                        {userSub.fileUrl && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-600 dark:text-slate-400">Attached File:</span>
                            {userSub.fileType === "image" || userSub.fileUrl.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/i) ? (
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl({ url: userSub.fileUrl!, title: "Your Submitted Photo" })}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold hover:bg-purple-100"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>{userSub.fileName || "Submitted Photo"} (Click to view)</span>
                              </button>
                            ) : (
                              <a
                                href={userSub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold hover:bg-red-100"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{userSub.fileName || "Submitted PDF / Document"}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Teacher's Evaluated Feedback & Graded Return File */}
                        {String(userSub.status).toUpperCase() === "GRADED" && (
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 text-xs">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                                <Award className="w-4 h-4" /> Instructor Feedback & Rubric:
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 italic">
                                "{userSub.feedback || "Well executed coursework with solid structure."}"
                              </p>
                            </div>

                            {/* Returned Graded PDF or Feedback Photo */}
                            {userSub.gradedFileUrl && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-300">Instructor Annotated File:</span>
                                {userSub.gradedFileType === "image" || userSub.gradedFileUrl.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImageUrl({ url: userSub.gradedFileUrl!, title: "Graded Feedback Photo" })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>{userSub.gradedFileName || "Feedback Photo"} (View)</span>
                                  </button>
                                ) : (
                                  <a
                                    href={userSub.gradedFileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={userSub.gradedFileName || "Graded_Feedback.pdf"}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold"
                                  >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span>{userSub.gradedFileName || "Download Graded PDF"}</span>
                                    <Download className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Not submitted yet
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setSubmissionText("");
                            setStudentUploadedFile(null);
                            setShowSubmitModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                        >
                          <Upload className="w-4 h-4" /> Submit Coursework (PDF / Photo / Repo)
                        </button>
                      </div>
                    )
                  ) : (
                    /* TEACHER / ADMIN SUBMISSIONS QUEUE */
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          Student Submissions ({(assignment.submissions || []).length})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {(assignment.submissions || []).filter(s => String(s.status).toUpperCase() === "GRADED").length} Graded
                        </span>
                      </div>

                      {(assignment.submissions || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">
                          No student submissions received yet for this assignment.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {(assignment.submissions || []).map((sub, subIdx) => {
                            const isGraded = String(sub.status).toUpperCase() === "GRADED";
                            const hasImage = sub.fileType === "image" || sub.fileUrl?.match(/\.(png|jpg|jpeg|webp|gif)$/i);
                            const hasPdf = sub.fileType === "pdf" || sub.fileUrl?.endsWith(".pdf");

                            return (
                              <div 
                                key={sub.studentId || subIdx} 
                                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <UserAvatar avatar={sub.studentAvatar} name={sub.studentName} role="STUDENT" size="sm" />
                                  <div className="overflow-hidden">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white truncate">
                                        {sub.studentName}
                                      </span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                        isGraded
                                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      }`}>
                                        {isGraded ? `${sub.grade}/${assignment.totalPoints}` : "Pending Review"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate max-w-sm">
                                      {sub.content || "Coursework submission with attached files"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  {/* Fast preview buttons for attached photo / PDF */}
                                  {hasImage && sub.fileUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImageUrl({ url: sub.fileUrl!, title: `${sub.studentName}'s Photo Submission` })}
                                      className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center gap-1 border border-purple-200 dark:border-purple-800"
                                      title="Preview student photo"
                                    >
                                      <ImageIcon className="w-3 h-3" /> Photo
                                    </button>
                                  )}

                                  {hasPdf && sub.fileUrl && (
                                    <a
                                      href={sub.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px] flex items-center gap-1 border border-red-200 dark:border-red-800"
                                      title="Open student PDF"
                                    >
                                      <FileText className="w-3 h-3" /> PDF
                                    </a>
                                  )}

                                  {/* Grade / Regrade Modal Trigger */}
                                  <button
                                    onClick={() => {
                                      setSelectedSubForGrade({ assignmentId: assignment.id, sub });
                                      setGradeInput(sub.grade || 90);
                                      setFeedbackInput(sub.feedback || "Solid implementation with clean logic.");
                                      setTeacherFeedbackFile(null);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all shadow-xs flex items-center gap-1 ${
                                      isGraded
                                        ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    {isGraded ? `Regrade (${sub.grade} pts)` : "Grade & Review"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. STUDENT SUBMISSION MODAL (WITH PDF & PHOTO UPLOAD) */}
      {/* ============================================================ */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  Submit Coursework: {selectedAssignment.title}
                </h2>
                <span className="text-[11px] text-slate-400">{selectedAssignment.courseTitle}</span>
              </div>
              <button 
                onClick={() => setShowSubmitModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4 text-xs">
              {/* Written Notes / Description */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Implementation Summary & Notes
                </label>
                <textarea
                  rows={3}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Explain your approach, key algorithm components, and instructions for running the code..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* PDF, PHOTO, NOTES & ARCHIVE UPLOAD SECTION */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    Attach Coursework PDF, Photo, Notes or Code Archive
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    High Capacity (Up to 1GB)
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Upload your written lab reports (PDF), diagram photos, raw lecture notes (.md/.txt/.docx), or project archives (ZIP).
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    ref={studentFileInputRef}
                    onChange={handleStudentFileUpload}
                    accept=".pdf,image/*,.png,.jpg,.jpeg,.webp,.gif,.zip,.tar,.gz,.docx,.doc,.txt,.md,.mp4,.webm,.mov"
                    className="hidden"
                    id="student-assignment-file-input"
                  />
                  <label
                    htmlFor="student-assignment-file-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Choose PDF, Picture, or Notes
                  </label>

                  {isUploadingStudentFile && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                      Saving file into SQLite...
                    </span>
                  )}
                </div>

                {studentUploadError && (
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{studentUploadError}</span>
                  </div>
                )}

                {/* Uploaded File Preview Card */}
                {studentUploadedFile && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {studentUploadedFile.fileType === "image" ? (
                        <img 
                          src={studentUploadedFile.url} 
                          alt="preview" 
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white truncate block">
                          {studentUploadedFile.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {studentUploadedFile.size} • {studentUploadedFile.fileType.toUpperCase()} Attached
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStudentUploadedFile(null)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Optional Repo / Demo Link */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Optional GitHub Repository / Live Project URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/coursework-repo"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingStudentFile}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Submit Coursework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TEACHER GRADING & REVIEW MODAL (WITH PDF & PHOTO VIEW/UPLOAD) */}
      {/* ============================================================ */}
      {selectedSubForGrade && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <UserAvatar avatar={selectedSubForGrade.sub.studentAvatar} name={selectedSubForGrade.sub.studentName} role="STUDENT" size="sm" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Grade Submission: {selectedSubForGrade.sub.studentName}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    Submitted on: {selectedSubForGrade.sub.submittedAt}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSubForGrade(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student's Written Notes */}
            {selectedSubForGrade.sub.content && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Student Solution Notes:</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedSubForGrade.sub.content}
                </p>
              </div>
            )}

            {/* Student's Attached Photo / PDF */}
            {selectedSubForGrade.sub.fileUrl && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">Student Coursework Attachment:</span>
                
                {selectedSubForGrade.sub.fileType === "image" || selectedSubForGrade.sub.fileUrl.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => setPreviewImageUrl({ url: selectedSubForGrade.sub.fileUrl!, title: `${selectedSubForGrade.sub.studentName}'s Photo` })}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 cursor-pointer relative group/img shrink-0 border border-slate-300 dark:border-slate-600 shadow-xs"
                    >
                      <img 
                        src={selectedSubForGrade.sub.fileUrl} 
                        alt="submission attachment" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedSubForGrade.sub.fileName || "Student Work Screenshot / Diagram"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPreviewImageUrl({ url: selectedSubForGrade.sub.fileUrl!, title: `${selectedSubForGrade.sub.studentName}'s Photo` })}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Open Full Resolution Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                          {selectedSubForGrade.sub.fileName || "Submitted PDF Report"}
                        </span>
                        <span className="text-[10px] text-slate-400">PDF Document</span>
                      </div>
                    </div>

                    <a
                      href={selectedSubForGrade.sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View / Download PDF
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Grading Form */}
            <form onSubmit={handleGradeSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Grade Points Awarded (out of 100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Detailed Feedback & Rubric</label>
                  <button
                    type="button"
                    onClick={onOpenAiAssistant}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Feedback Draft
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide constructive feedback, test results, code comments, or areas of excellence..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

                {/* Optional: Teacher Uploading Graded PDF / Feedback Photo / Notes */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Optional: Attach Graded PDF, Annotated Photo, or Review Notes (Up to 1GB)
                </span>
                
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={teacherFileInputRef}
                    onChange={handleTeacherFeedbackFileUpload}
                    accept=".pdf,image/*,.png,.jpg,.jpeg,.webp,.gif,.docx,.doc,.txt,.md,.zip"
                    className="hidden"
                    id="teacher-graded-file-input"
                  />
                  <label
                    htmlFor="teacher-graded-file-input"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach Graded File / Notes
                  </label>

                  {isUploadingTeacherFile && (
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 animate-pulse">
                      Uploading feedback file...
                    </span>
                  )}
                </div>

                {teacherFeedbackFile && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {teacherFeedbackFile.fileName} ({teacherFeedbackFile.fileType.toUpperCase()})
                    </span>
                    <button
                      type="button"
                      onClick={() => setTeacherFeedbackFile(null)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubForGrade(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingTeacherFile}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Award className="w-4 h-4" /> Save Grade & Return to Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. CREATE ASSIGNMENT MODAL (TEACHER ONLY WITH PDF & PHOTO ATTACHMENTS) */}
      {/* ============================================================ */}
      {showCreateModal && canUploadAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Upload Course Assignment & Material
                </h2>
                <p className="text-xs text-slate-500">Attach PDF problem sets, rubrics, diagrams, and photos</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Course Target *</label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Assignment 3: React Hooks & State Performance Audit"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description & Requirements *</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe problem statement, objectives, grading criteria, and deliverables..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Total Max Points</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={newTotalPoints}
                    onChange={(e) => setNewTotalPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* TEACHER ATTACHMENTS (PDF, PHOTOS, LECTURE MEDIA, NOTES) */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    Attach Problem Set PDF, Diagram Photos, Notes, or Reference Files
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    High Capacity (Up to 1GB per file)
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Upload PDF assignment briefs, rubric guidelines, high-resolution architecture photos, lecture notes, or project starter code.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    ref={createFileInputRef}
                    onChange={handleTeacherAttachmentUpload}
                    multiple
                    accept=".pdf,image/*,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.txt,.md,.zip,.tar,.gz,.mp4,.webm"
                    className="hidden"
                    id="teacher-create-assignment-file-input"
                  />
                  <label
                    htmlFor="teacher-create-assignment-file-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Select PDF / Photos / Notes
                  </label>

                  {isUploadingAttachment && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                      Uploading to SQLite...
                    </span>
                  )}
                </div>

                {attachmentError && (
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{attachmentError}</span>
                  </div>
                )}

                {/* Attached Files List */}
                {teacherAttachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Attached Files ({teacherAttachments.length}):
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {teacherAttachments.map((att, idx) => (
                        <div
                          key={att.id || idx}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-700 text-indigo-600">
                              {att.type === "pdf" ? <FileText className="w-3.5 h-3.5 text-red-600" /> :
                               att.type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-purple-600" /> :
                               <Paperclip className="w-3.5 h-3.5" />}
                            </span>
                            <div className="truncate">
                              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                                {att.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {att.size} • {att.type.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTeacherAttachment(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
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
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAttachment}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. ADMIN ASSIGNMENT DELETION CONFIRMATION MODAL (ADMIN ONLY) */}
      {/* ============================================================ */}
      {assignmentToDelete && canDeleteAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Assignment</h3>
                <p className="text-xs text-slate-500">Administrator Master Control</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete assignment <strong className="text-slate-900 dark:text-white font-bold">"{assignmentToDelete.title}"</strong> ({assignmentToDelete.courseTitle})?
              This will purge all student submissions, attached PDFs, photos, and grade records from the website.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAssignmentToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAssignment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. FULL-RESOLUTION PHOTO LIGHTBOX PREVIEW MODAL */}
      {/* ============================================================ */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in-95">
            <div className="w-full flex items-center justify-between text-white pb-3">
              <span className="font-bold text-sm truncate flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                {previewImageUrl.title}
              </span>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close Photo Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-black flex items-center justify-center">
              <img
                src={previewImageUrl.url}
                alt={previewImageUrl.title}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
