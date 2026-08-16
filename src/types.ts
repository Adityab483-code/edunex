export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: string;
  officialId?: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  bio?: string;
  department?: string;
  title?: string;
  approved?: boolean;
  xp?: number;
  enrolledCourseIds?: string[];
  goals?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type?: 'video' | 'reading' | 'quiz' | 'practical';
  summary?: string;
  videoUrl?: string;
  pdfUrl?: string;
  slidesUrl?: string;
  fileName?: string;
  uploadId?: string;
  completed?: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  lessons: Lesson[];
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'pdf' | 'code' | 'presentation' | 'video' | 'link' | 'other';
  url: string;
  size?: string;
  fileName?: string;
  uploadId?: string;
  mimeType?: string;
  uploadedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'Technical' | 'Soft Skills' | 'AI & Data' | 'Cybersecurity' | 'Design' | 'General';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructorId?: string;
  instructorName: string;
  instructorAvatar: string;
  thumbnail: string;
  duration: string;
  enrolledCount: number;
  rating: number;
  lessonsCount?: number;
  lessons?: Lesson[];
  modules?: CourseModule[];
  resources?: CourseResource[];
  skillsTaught?: string[];
  createdAt?: string;
}

export interface AssignmentAttachment {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'image' | 'file';
  size?: string;
  fileName?: string;
  uploadId?: string;
}

export interface AssignmentSubmission {
  id?: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  submittedAt: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'pdf' | 'image' | 'file';
  fileSize?: string;
  attachments?: AssignmentAttachment[];
  grade?: number;
  feedback?: string;
  gradedFileUrl?: string;
  gradedFileName?: string;
  gradedFileType?: 'pdf' | 'image' | 'file';
  aiPlagiarismScore?: number;
  status: 'SUBMITTED' | 'GRADED' | 'pending' | 'graded';
}

export interface Assignment {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  deadline: string;
  totalPoints: number;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  submissions: AssignmentSubmission[];
  attachments?: AssignmentAttachment[];
  instructorId?: string;
  instructorName?: string;
  createdAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  isCompleted?: boolean;
  score?: number;
  type?: 'ai_generated' | 'teacher_uploaded';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  instructorId?: string;
  instructorName?: string;
  instructorAvatar?: string;
  createdAt?: string;
  totalPoints?: number;
  tags?: string[];
  description?: string;
}

export interface ProjectMember {
  studentId: string;
  studentName: string;
  studentAvatar: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  members: ProjectMember[];
  milestones: ProjectMilestone[];
  repoUrl?: string;
  demoUrl?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: number; // 0 - 100
  endorsements: number;
  targetRoles: string[];
}

export type StudentSkill = Skill;

export interface Discussion {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorName: string;
  authorAvatar: string;
  authorRole: Role;
  createdAt: string;
  upvotes: number;
  repliesCount: number;
  isResolved: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  text?: string;
  senderName?: string;
  senderRole?: string;
  senderAvatar?: string;
  recipientId?: string;
  recipientName?: string;
  courseId?: string;
  timestamp: string;
  read: boolean;
  isRead?: boolean;
  isAnnouncement?: boolean;
}

export type ChatMessage = Message;

export interface Certificate {
  id: string;
  certificateId?: string;
  studentId?: string;
  studentName: string;
  courseId?: string;
  courseTitle: string;
  issueHash?: string;
  issueDate: string;
  teacherName?: string;
  scorePercent?: number;
  skillsVerified?: string[];
  skillsEarned?: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timeAgo?: string;
  type?: string;
  userId?: string;
  createdAt?: string;
}

export interface SystemComplaint {
  id: string;
  studentId?: string;
  studentOfficialId?: string;
  studentName: string;
  studentEmail?: string;
  studentAvatar?: string;
  submitterRole?: Role | string;
  courseId?: string;
  courseTitle?: string;
  category?: 'Course Content' | 'Teacher / Faculty' | 'Technical / Platform Bug' | 'Assessment & Grades' | 'Platform Suggestion' | 'General Feedback' | string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  rating?: number;
  issue: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminReply?: string;
  adminRepliedAt?: string;
  adminName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeUsersToday: number;
  courseCompletionRate: number;
  avgStudentScore: number;
  assignmentCompletionRate: number;
  popularCourses: { name: string; enrolled: number }[];
  mostImprovedStudents: { name: string; progressGain: number; avatar: string }[];
  skillGrowthStats: { category: string; averageLevel: number }[];
}

export type MistakeType =
  | 'Concept misunderstanding'
  | 'Misconception'
  | 'Memory failure'
  | 'Careless error'
  | 'Pattern recognition failure'
  | 'Reasoning failure'
  | 'Calculation error'
  | 'Misreading'
  | 'Guessing'
  | 'Overconfidence'
  | 'Lack of confidence'
  | 'Difficulty transferring knowledge'
  | 'Time-pressure error';

export interface MistakeDnaEntry {
  id: string;
  studentId: string;
  concept: string;
  mistakeType: MistakeType;
  studentAnswer: string;
  correctReasoning: string;
  confidence: number; // 0-100% confidence level when answer was submitted
  recurrenceCount: number;
  severity: 'Low' | 'Medium' | 'Critical';
  recommendedIntervention: string;
  timestamp: string;
  contextType?: 'isolated_quiz' | 'real_world_problem' | 'timed_exam' | 'open_socratic' | 'practical_mission';
  resolved?: boolean;
}

export interface ConceptMasteryNode {
  concept: string;
  masteryScore: number; // 0-100
  confidenceLevel: number; // 0-100
  evidenceCount: number;
  retentionStability: number; // 0-100
  transferAbility: number; // 0-100
  lastTested: string;
  predictedDecayDays: number;
  subtopics?: { [name: string]: number };
}

export interface SimulatorScenario {
  title: string;
  description: string;
  codeOrProblem: string;
  contextType: string;
  options: string[];
  correctChoice: number;
  explanation: string;
  targetMisconception: string;
}

export interface PredictedRisk {
  id: string;
  concept: string;
  riskScore: number; // 0-100%
  reason: string;
  recommendedIntervention: string;
  contextTrigger: string;
  currentMastery: number; // e.g. 48%
  prerequisitesMastered: { concept: string; score: number }[];
  simulatorScenario?: SimulatorScenario;
}

export interface BehaviorLogEntry {
  id: string;
  timestamp: string;
  actionType: 'answered_question' | 'made_error' | 'explained_concept' | 'completed_mission' | 'asked_ai' | 'revisited_topic' | 'transfer_challenge';
  summary: string;
  deltaImpact: string;
  concept?: string;
}

export interface RecommendedIntervention {
  id: string;
  title: string;
  type: 'debugging_mission' | 'socratic_inquiry' | 'spaced_retrieval' | 'transfer_sandbox' | 'concept_explainer';
  concept: string;
  urgency: 'High' | 'Medium' | 'Low';
  estimatedMinutes: number;
  description: string;
  missionScenario?: SimulatorScenario;
}

export interface LearningTwinProfile {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  concept_mastery: { [concept: string]: ConceptMasteryNode };
  reasoning_score: number; // 0-100
  concept_transfer_score: number; // 0-100
  confidence_score: number; // 0-100
  retention_score: number; // 0-100
  response_time_avg_sec: number;
  guessing_vs_reasoning: {
    guessing_tendency: number; // 0-100%
    reasoning_depth: number; // 0-100%
    time_per_question_avg: number;
  };
  explanation_ability: {
    score: number; // 0-100
    depthRating: 'Surface' | 'Functional' | 'Deep First-Principles';
    evaluationsCount: number;
    lastExplanationSample?: string;
  };
  mistake_patterns: MistakeDnaEntry[];
  learning_preferences: string[];
  predicted_risks: PredictedRisk[];
  recent_behavior: BehaviorLogEntry[];
  recommended_interventions: RecommendedIntervention[];
  lastUpdated: string;
}
