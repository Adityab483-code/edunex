import { 
  User, 
  Course, 
  CourseResource, 
  Assignment, 
  Quiz, 
  QuizQuestion, 
  Project, 
  Skill, 
  Discussion, 
  Message, 
  Certificate, 
  AppNotification, 
  AdminAnalytics, 
  SystemComplaint,
  LearningTwinProfile,
  MistakeDnaEntry,
  MistakeType,
  ConceptMasteryNode,
  PredictedRisk,
  SimulatorScenario,
  RecommendedIntervention
} from "../types";

// User storage helpers (No hardcoded demo accounts - users create their own)
export const MOCK_USERS: User[] = [];

const USERS_STORAGE_KEY = "edunex_registered_users";
const USERS_STORAGE_FALLBACK = "smartlearn_registered_users";
const CURRENT_USER_KEY = "edunex_active_session_user";
const CURRENT_USER_FALLBACK = "smartlearn_active_session_user";

export function getStoredUsers(): User[] {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(USERS_STORAGE_FALLBACK);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to load stored users from localStorage:", err);
  }
  return [];
}

export function saveStoredUsers(usersList: User[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
  } catch (err) {
    console.warn("Failed to persist users to localStorage:", err);
  }
}

export function addOrUpdateStoredUser(user: User): User[] {
  const current = getStoredUsers();
  const index = current.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  let updated: User[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...user };
  } else {
    updated = [user, ...current];
  }
  saveStoredUsers(updated);
  return updated;
}

export function removeStoredUser(userId: string): User[] {
  const current = getStoredUsers();
  const updated = current.filter(u => u.id !== userId);
  saveStoredUsers(updated);
  return updated;
}

export function getStoredCurrentUser(): User | null {
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(CURRENT_USER_FALLBACK);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn("Failed to load current session user:", err);
  }
  return null;
}

export function setStoredCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(CURRENT_USER_FALLBACK);
    }
  } catch (err) {
    console.warn("Failed to persist current session user:", err);
  }
}

// Storage keys
const COURSES_STORAGE_KEY = "edunex_courses";
const ASSIGNMENTS_STORAGE_KEY = "edunex_assignments";
const QUIZZES_STORAGE_KEY = "edunex_quizzes";
const PROJECTS_STORAGE_KEY = "edunex_projects";
const SKILLS_STORAGE_KEY = "edunex_skills";
const DISCUSSIONS_STORAGE_KEY = "edunex_discussions";
const MESSAGES_STORAGE_KEY = "edunex_messages";
const CERTIFICATES_STORAGE_KEY = "edunex_certificates";
const NOTIFICATIONS_STORAGE_KEY = "edunex_notifications";
const COMPLAINTS_STORAGE_KEY = "edunex_complaints";

function loadFromStorage<T>(key: string, defaultVal: T): T {
  try {
    const fallbackKey = key.replace("edunex_", "smartlearn_");
    const item = localStorage.getItem(key) || localStorage.getItem(fallbackKey);
    if (item) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.warn(`Failed to read ${key} from storage:`, err);
  }
  return defaultVal;
}

function saveToStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`Failed to save ${key} to storage:`, err);
  }
}

// Courses Storage
export function getStoredCourses(): Course[] {
  return loadFromStorage<Course[]>(COURSES_STORAGE_KEY, []);
}
export function saveStoredCourses(courses: Course[]): void {
  saveToStorage(COURSES_STORAGE_KEY, courses);
}

// Assignments Storage
export function getStoredAssignments(): Assignment[] {
  return loadFromStorage<Assignment[]>(ASSIGNMENTS_STORAGE_KEY, []);
}
export function saveStoredAssignments(assignments: Assignment[]): void {
  saveToStorage(ASSIGNMENTS_STORAGE_KEY, assignments);
}

// Quizzes Storage
export function getStoredQuizzes(): Quiz[] {
  return loadFromStorage<Quiz[]>(QUIZZES_STORAGE_KEY, []);
}
export function saveStoredQuizzes(quizzes: Quiz[]): void {
  saveToStorage(QUIZZES_STORAGE_KEY, quizzes);
}

// Projects Storage
export function getStoredProjects(): Project[] {
  return loadFromStorage<Project[]>(PROJECTS_STORAGE_KEY, []);
}
export function saveStoredProjects(projects: Project[]): void {
  saveToStorage(PROJECTS_STORAGE_KEY, projects);
}

// Skills Storage
export function getStoredSkills(): Skill[] {
  return loadFromStorage<Skill[]>(SKILLS_STORAGE_KEY, []);
}
export function saveStoredSkills(skills: Skill[]): void {
  saveToStorage(SKILLS_STORAGE_KEY, skills);
}

// Discussions Storage
export function getStoredDiscussions(): Discussion[] {
  return loadFromStorage<Discussion[]>(DISCUSSIONS_STORAGE_KEY, []);
}
export function saveStoredDiscussions(discussions: Discussion[]): void {
  saveToStorage(DISCUSSIONS_STORAGE_KEY, discussions);
}

// Messages Storage
export function getStoredMessages(): Message[] {
  return loadFromStorage<Message[]>(MESSAGES_STORAGE_KEY, []);
}
export function saveStoredMessages(messages: Message[]): void {
  saveToStorage(MESSAGES_STORAGE_KEY, messages);
}

// Certificates Storage
export function getStoredCertificates(): Certificate[] {
  return loadFromStorage<Certificate[]>(CERTIFICATES_STORAGE_KEY, []);
}
export function saveStoredCertificates(certificates: Certificate[]): void {
  saveToStorage(CERTIFICATES_STORAGE_KEY, certificates);
}

// Notifications Storage
export function getStoredNotifications(): AppNotification[] {
  return loadFromStorage<AppNotification[]>(NOTIFICATIONS_STORAGE_KEY, []);
}
export function saveStoredNotifications(notifications: AppNotification[]): void {
  saveToStorage(NOTIFICATIONS_STORAGE_KEY, notifications);
}

// Complaints Storage
export function getStoredComplaints(): SystemComplaint[] {
  return loadFromStorage<SystemComplaint[]>(COMPLAINTS_STORAGE_KEY, []);
}
export function saveStoredComplaints(complaints: SystemComplaint[]): void {
  saveToStorage(COMPLAINTS_STORAGE_KEY, complaints);
}
export function addOrUpdateStoredComplaint(complaint: SystemComplaint): SystemComplaint[] {
  const current = getStoredComplaints();
  const index = current.findIndex(c => c.id === complaint.id);
  let updated: SystemComplaint[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...complaint };
  } else {
    updated = [complaint, ...current];
  }
  saveStoredComplaints(updated);
  return updated;
}
export function removeStoredComplaint(id: string): SystemComplaint[] {
  const current = getStoredComplaints();
  const updated = current.filter(c => c.id !== id);
  saveStoredComplaints(updated);
  return updated;
}

// Empty Mock Arrays for backward compatibility (Zero demo items)
export const MOCK_COURSES: Course[] = [];
export const MOCK_ASSIGNMENTS: Assignment[] = [];
export const MOCK_QUIZZES: Quiz[] = [];
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_SKILLS: Skill[] = [];
export const MOCK_DISCUSSIONS: Discussion[] = [];
export const MOCK_MESSAGES: Message[] = [];
export const MOCK_CERTIFICATES: Certificate[] = [];
export const MOCK_NOTIFICATIONS: AppNotification[] = [];
export const MOCK_COMPLAINTS: SystemComplaint[] = [];

export const MOCK_ADMIN_ANALYTICS: AdminAnalytics = {
  totalStudents: 0,
  totalTeachers: 0,
  totalCourses: 0,
  activeUsersToday: 0,
  courseCompletionRate: 0,
  avgStudentScore: 0,
  assignmentCompletionRate: 0,
  popularCourses: [],
  mostImprovedStudents: [],
  skillGrowthStats: []
};

// Helper functions (synchronous getters for state)
export function fetchUsers(): User[] {
  return getStoredUsers();
}

export function fetchCourses(): Course[] {
  return getStoredCourses();
}

export function fetchAssignments(): Assignment[] {
  return getStoredAssignments();
}

export function fetchQuizzes(): Quiz[] {
  return getStoredQuizzes();
}

export function fetchProjects(): Project[] {
  return getStoredProjects();
}

export function fetchSkills(): Skill[] {
  return getStoredSkills();
}

export function fetchDiscussions(): Discussion[] {
  return getStoredDiscussions();
}

export function fetchMessages(): Message[] {
  return getStoredMessages();
}

export function fetchCertificates(): Certificate[] {
  return getStoredCertificates();
}

export function fetchNotifications(): AppNotification[] {
  return getStoredNotifications();
}

export function fetchAdminAnalytics(): AdminAnalytics {
  const users = getStoredUsers();
  const courses = getStoredCourses();
  const assignments = getStoredAssignments();
  const students = users.filter(u => String(u.role).toLowerCase() === "student");
  const teachers = users.filter(u => String(u.role).toLowerCase() === "teacher");

  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalCourses: courses.length,
    activeUsersToday: users.length > 0 ? 1 : 0,
    courseCompletionRate: courses.length > 0 ? 100 : 0,
    avgStudentScore: 0,
    assignmentCompletionRate: assignments.length > 0 ? 100 : 0,
    popularCourses: courses.slice(0, 5).map(c => ({ name: c.title, enrolled: c.enrolledCount || 0 })),
    mostImprovedStudents: [],
    skillGrowthStats: []
  };
}

export function fetchComplaints(): SystemComplaint[] {
  return getStoredComplaints();
}

export async function uploadCourseFile(
  file: File, 
  options?: { courseId?: string; title?: string; resourceType?: string }
): Promise<{ success: boolean; file: CourseResource & { uploadId: string } }> {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.courseId) formData.append("courseId", options.courseId);
  if (options?.title) formData.append("title", options.title);
  if (options?.resourceType) formData.append("resourceType", options.resourceType);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status: ${res.status}`);
  }

  return res.json();
}

export async function uploadMultipleFiles(
  files: File[], 
  courseId?: string
): Promise<{ success: boolean; files: (CourseResource & { uploadId: string })[] }> {
  const formData = new FormData();
  files.forEach(f => formData.append("files", f));
  if (courseId) formData.append("courseId", courseId);

  const res = await fetch("/api/upload/multiple", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Multiple file upload failed with status: ${res.status}`);
  }

  return res.json();
}

export async function deleteCourseApi(courseId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/courses/${courseId}`, {
      method: "DELETE"
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to call DELETE /api/courses:", err);
    return false;
  }
}

export async function createAssignmentApi(assignment: Partial<Assignment>): Promise<Assignment> {
  try {
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignment)
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to call POST /api/assignments:", err);
  }
  return assignment as Assignment;
}

export async function deleteAssignmentApi(assignmentId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/assignments/${assignmentId}`, {
      method: "DELETE"
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to call DELETE /api/assignments:", err);
    return false;
  }
}

export async function createQuizApi(quiz: Partial<Quiz>): Promise<Quiz> {
  try {
    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quiz)
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to call POST /api/quizzes:", err);
  }
  return quiz as Quiz;
}

export async function deleteQuizApi(quizId: string, requesterRole: string = "ADMIN"): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/quizzes/${quizId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": requesterRole
      },
      body: JSON.stringify({ requesterRole })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to delete quiz." };
    }
    return { success: true };
  } catch (err) {
    console.warn("Failed to call DELETE /api/quizzes:", err);
    return { success: true };
  }
}

export async function generateAiQuizApi(params: {
  topic: string;
  difficulty?: string;
  questionCount?: number;
  courseTitle?: string;
}): Promise<Quiz> {
  const count = Math.min(7, Math.max(6, params.questionCount || 7));
  try {
    const res = await fetch("/api/ai/quiz-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        questionCount: count
      })
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to generate AI quiz via endpoint, using dynamic constructor:", err);
  }

  // Fallback client-side generator with strictly 6 or 7 questions
  const topic = params.topic || "Full-Stack Web Development";
  const diff = params.difficulty || "Intermediate";
  const fallbackQuestions: QuizQuestion[] = [
    {
      id: `ai-q-fb-1-${Date.now()}`,
      question: `In ${topic}, what is the fundamental purpose of maintaining pure functions in computational pipelines?`,
      options: [
        "To allow arbitrary mutation of global window properties",
        "To ensure identical outputs for given inputs with zero observable side effects",
        "To disable all asynchronous network operations",
        "To automatically generate HTML documentation"
      ],
      correctAnswer: 1,
      explanation: "Pure functions guarantee deterministic output for the same input arguments without mutating outside state.",
      topic: "Core Fundamentals"
    },
    {
      id: `ai-q-fb-2-${Date.now()}`,
      question: `When managing asynchronous state in modern single-page applications, which approach prevents memory leaks on unmount?`,
      options: [
        "Canceling active async subscriptions/requests using AbortController or cleanup functions",
        "Executing continuous polling without interval clearance",
        "Using synchronous sleep calls in the browser main thread",
        "Deleting components directly from the browser DOM tree"
      ],
      correctAnswer: 0,
      explanation: "Cleanup functions in useEffect hooks or AbortControllers cancel unresolved promises and listeners when components unmount.",
      topic: "Asynchronous State"
    },
    {
      id: `ai-q-fb-3-${Date.now()}`,
      question: `Which HTTP response status code indicates an invalid client payload that failed server schema validation?`,
      options: [
        "200 OK",
        "302 Found",
        "400 Bad Request / 422 Unprocessable Entity",
        "500 Internal Server Error"
      ],
      correctAnswer: 2,
      explanation: "400 Bad Request and 422 Unprocessable Entity communicate that client request parameters failed validation constraints.",
      topic: "REST & API Protocols"
    },
    {
      id: `ai-q-fb-4-${Date.now()}`,
      question: `What is the amortized time complexity of retrieving a record by key in a properly balanced binary search tree (BST)?`,
      options: [
        "O(1)",
        "O(log n)",
        "O(n)",
        "O(n log n)"
      ],
      correctAnswer: 1,
      explanation: "Balanced binary search trees divide the remaining search range in half at each node step, achieving logarithmic O(log n) time.",
      topic: "Data Structures"
    },
    {
      id: `ai-q-fb-5-${Date.now()}`,
      question: `Which architectural pattern decouples business logic from presentation components for testability?`,
      options: [
        "Hardcoding database connection strings directly inside JSX buttons",
        "Custom hooks, presenter controllers, and dependency injection services",
        "Using single monolithic 5,000-line render files",
        "Storing sensitive JWT secret keys in client localStorage"
      ],
      correctAnswer: 1,
      explanation: "Extracting business logic into custom hooks and services separates state operations from UI rendering, enhancing modularity and unit testability.",
      topic: "Architecture & Design"
    },
    {
      id: `ai-q-fb-6-${Date.now()}`,
      question: `What is the primary objective of Cross-Site Request Forgery (CSRF) tokens in session authentication?`,
      options: [
        "To compress HTTP request payloads for bandwidth optimization",
        "To verify that requests originate from authenticated user interfaces and not unauthorized third-party sites",
        "To encrypt all database table columns with AES-256",
        "To bypass HTTPS encryption certificates"
      ],
      correctAnswer: 1,
      explanation: "CSRF tokens validate that incoming state-changing requests originate genuinely from the authenticated client app session.",
      topic: "Security & Protection"
    },
    {
      id: `ai-q-fb-7-${Date.now()}`,
      question: `Why is defensive schema validation essential at API ingress boundaries?`,
      options: [
        "It prevents malformed or malicious payloads from causing unhandled runtime exceptions and corrupting database integrity",
        "It allows clients to bypass all authentication checks",
        "It reduces browser screen resolution automatically",
        "It converts SQL queries into markdown documents"
      ],
      correctAnswer: 0,
      explanation: "Validating input schemas at API boundaries rejects invalid data types early, preserving database consistency and preventing crash loops.",
      topic: "API Robustness"
    }
  ].slice(0, count);

  return {
    id: `ai-quiz-${Date.now()}`,
    courseId: "ai-custom",
    courseTitle: params.courseTitle || `${topic} AI Challenge`,
    title: `${topic} — AI Interactive Quiz (${count} Questions)`,
    timeLimitMinutes: count * 2,
    type: "ai_generated",
    difficulty: (params.difficulty as any) || "Intermediate",
    instructorName: "EduNex AI Mentor",
    instructorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100",
    createdAt: new Date().toISOString(),
    totalPoints: count * 10,
    tags: ["AI Generated", "Adaptive", diff, `${count} Questions`],
    description: `Adaptive ${count}-question diagnostic assessment generated by EduNex AI covering ${topic}.`,
    questions: fallbackQuestions
  };
}

export async function submitQuizApi(
  quizId: string, 
  studentId: string, 
  studentName: string, 
  answers: Record<string, number>
): Promise<any> {
  try {
    const res = await fetch(`/api/quizzes/${quizId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, studentName, answers })
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to call POST /api/quizzes/:id/submit:", err);
  }
  return null;
}

export async function submitAssignmentApi(assignmentId: string, submissionData: any): Promise<any> {
  try {
    const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionData)
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to call POST /api/assignments/:id/submit:", err);
  }
  return submissionData;
}

export async function gradeAssignmentApi(payload: {
  assignmentId: string;
  submissionId?: string;
  studentId?: string;
  grade: number;
  feedback: string;
  gradedFileUrl?: string;
  gradedFileName?: string;
  gradedFileType?: string;
}): Promise<any> {
  try {
    const res = await fetch("/api/assignments/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to call POST /api/assignments/grade:", err);
  }
  return payload;
}

export async function createCourseApi(course: Course): Promise<Course> {
  try {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(course)
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to call POST /api/courses, using local representation:", err);
  }
  return course;
}

export async function fetchCourseUploads(courseId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/uploads/course/${courseId}`);
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to fetch course uploads from SQLite:", err);
  }
  return [];
}

export async function deleteUserApi(userId: string, requesterRole: string = "ADMIN"): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": requesterRole
      },
      body: JSON.stringify({ requesterRole })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to delete user account." };
    }
    return { success: true, message: data.message };
  } catch (err) {
    console.warn("Failed to call DELETE /api/users, continuing with local cleanup:", err);
    return { success: true, message: "Account removed locally." };
  }
}

export async function fetchUsersApi(): Promise<User[]> {
  try {
    const res = await fetch("/api/auth/users");
    if (res.ok) {
      const serverUsers: User[] = await res.json();
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        saveStoredUsers(serverUsers);
        return serverUsers;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch users from server:", err);
  }
  return getStoredUsers();
}

export async function enrollCourseApi(courseId: string, studentId: string): Promise<{ success: boolean; student?: User; course?: Course }> {
  try {
    const res = await fetch(`/api/courses/${courseId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Failed to call POST /api/courses/:id/enroll:", err);
  }
  return { success: false };
}

export async function saveUserApi(user: User): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      addOrUpdateStoredUser(user);
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Failed to call POST /api/auth/users:", err);
    addOrUpdateStoredUser(user);
    return false;
  }
}

export async function askAiAssistant(
  prompt: string, 
  mode: string = "general-chat",
  userRole: string = "STUDENT",
  contextData?: any
): Promise<string> {
  try {
    const res = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode, userRole, contextData })
    });
    const data = await res.json();
    return data.reply || "I am here to assist your educational goals!";
  } catch (err) {
    return "I am here to help you solve problems and build curriculum! Please try asking your question again.";
  }
}

export async function fetchComplaintsApi(): Promise<SystemComplaint[]> {
  try {
    const res = await fetch("/api/complaints");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredComplaints(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch complaints from API, using local storage:", err);
  }
  return getStoredComplaints();
}

export async function createComplaintApi(complaintData: Partial<SystemComplaint>): Promise<SystemComplaint> {
  const localComplaint: SystemComplaint = {
    id: complaintData.id || `cmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId: complaintData.studentId || "usr-1",
    studentOfficialId: complaintData.studentOfficialId || "",
    studentName: complaintData.studentName || "Student",
    studentEmail: complaintData.studentEmail || "",
    studentAvatar: complaintData.studentAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    courseId: complaintData.courseId || "",
    courseTitle: complaintData.courseTitle || "General Platform",
    category: complaintData.category || "General Feedback",
    priority: complaintData.priority || "Medium",
    rating: complaintData.rating !== undefined ? complaintData.rating : 5,
    issue: complaintData.issue || "",
    status: "OPEN",
    adminReply: "",
    adminRepliedAt: "",
    adminName: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(localComplaint)
    });
    if (res.ok) {
      const serverComplaint = await res.json();
      addOrUpdateStoredComplaint(serverComplaint);
      return serverComplaint;
    }
  } catch (err) {
    console.warn("Could not post complaint to API, saving locally:", err);
  }

  addOrUpdateStoredComplaint(localComplaint);
  return localComplaint;
}

export async function updateComplaintApi(id: string, updates: { status?: string; adminReply?: string; adminName?: string }): Promise<SystemComplaint | null> {
  try {
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.complaint) {
        addOrUpdateStoredComplaint(data.complaint);
        return data.complaint;
      }
    }
  } catch (err) {
    console.warn("Could not patch complaint on API, updating locally:", err);
  }

  const current = getStoredComplaints();
  const found = current.find(c => c.id === id);
  if (found) {
    const updated: SystemComplaint = {
      ...found,
      status: (updates.status as any) || found.status,
      adminReply: updates.adminReply !== undefined ? updates.adminReply : found.adminReply,
      adminName: updates.adminName !== undefined ? updates.adminName : found.adminName,
      adminRepliedAt: updates.adminReply ? new Date().toISOString() : found.adminRepliedAt,
      updatedAt: new Date().toISOString()
    };
    addOrUpdateStoredComplaint(updated);
    return updated;
  }
  return null;
}

export async function deleteComplaintApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/complaints/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      removeStoredComplaint(id);
      return true;
    }
  } catch (err) {
    console.warn("Could not delete complaint on API, removing locally:", err);
  }
  removeStoredComplaint(id);
  return true;
}

export function addOrUpdateStoredCertificate(cert: Certificate): Certificate[] {
  const current = getStoredCertificates();
  const index = current.findIndex(c => c.id === cert.id || (c.studentId === cert.studentId && c.courseId === cert.courseId));
  let updated: Certificate[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...cert };
  } else {
    updated = [cert, ...current];
  }
  saveStoredCertificates(updated);
  return updated;
}

export async function fetchCertificatesApi(): Promise<Certificate[]> {
  try {
    const res = await fetch("/api/certificates");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredCertificates(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch certificates from API, using storage:", err);
  }
  return getStoredCertificates();
}

export async function createCertificateApi(certData: Partial<Certificate>): Promise<Certificate> {
  const localCert: Certificate = {
    id: certData.id || `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    certificateId: certData.certificateId || `SML-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    studentId: certData.studentId,
    studentName: certData.studentName || "Student",
    courseId: certData.courseId,
    courseTitle: certData.courseTitle || "Course Assessment",
    issueHash: certData.issueHash || `SHA256-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    issueDate: certData.issueDate || new Date().toISOString().split("T")[0],
    teacherName: certData.teacherName || "Academic Faculty",
    scorePercent: certData.scorePercent !== undefined ? certData.scorePercent : 100,
    skillsVerified: certData.skillsVerified || certData.skillsEarned || ["Course Mastery", "Assessment Excellence"],
    skillsEarned: certData.skillsEarned || ["Course Mastery"]
  };

  try {
    const res = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(localCert)
    });
    if (res.ok) {
      const serverCert = await res.json();
      addOrUpdateStoredCertificate(serverCert);
      return serverCert;
    }
  } catch (err) {
    console.warn("Could not post certificate to API, saving locally:", err);
  }

  addOrUpdateStoredCertificate(localCert);
  return localCert;
}

// =========================================================================
// LEARNTWIN: AI LEARNING TWIN, MISTAKE DNA & FUTURE FAILURE SIMULATOR ENGINE
// =========================================================================

const LEARNTWIN_STORAGE_PREFIX = "edunex_learntwin_v2_";

export function generateDefaultLearningTwin(studentId: string, studentName: string, avatar?: string): LearningTwinProfile {
  return {
    studentId,
    studentName,
    studentAvatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    concept_mastery: {},
    reasoning_score: 0,
    concept_transfer_score: 0,
    confidence_score: 0,
    retention_score: 0,
    response_time_avg_sec: 0,
    guessing_vs_reasoning: {
      guessing_tendency: 0,
      reasoning_depth: 0,
      time_per_question_avg: 0
    },
    explanation_ability: {
      score: 0,
      depthRating: "Surface",
      evaluationsCount: 0
    },
    mistake_patterns: [],
    learning_preferences: [],
    predicted_risks: [],
    recent_behavior: [],
    recommended_interventions: [],
    lastUpdated: new Date().toISOString()
  };
}

export function getStoredLearningTwin(studentId: string, studentName?: string, avatar?: string): LearningTwinProfile {
  const key = `${LEARNTWIN_STORAGE_PREFIX}${studentId}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Verify it is a valid v2 profile and sanitize IDs to prevent key collision
      if (parsed && parsed.studentId) {
        if (Array.isArray(parsed.recent_behavior)) {
          const seenIds = new Set<string>();
          parsed.recent_behavior = parsed.recent_behavior.map((b: any, idx: number) => {
            let bid = b.id || `act-${Date.now()}-${idx}`;
            if (seenIds.has(bid)) {
              bid = `act-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seenIds.add(bid);
            return { ...b, id: bid };
          });
        }
        if (Array.isArray(parsed.predicted_risks)) {
          const seenRiskIds = new Set<string>();
          parsed.predicted_risks = parsed.predicted_risks.map((r: any, idx: number) => {
            let rid = r.id || `risk-${Date.now()}-${idx}`;
            if (seenRiskIds.has(rid)) {
              rid = `risk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seenRiskIds.add(rid);
            return { ...r, id: rid };
          });
        }
        if (Array.isArray(parsed.mistake_patterns)) {
          const seenMistakeIds = new Set<string>();
          parsed.mistake_patterns = parsed.mistake_patterns.map((m: any, idx: number) => {
            let mid = m.id || `mdna-${Date.now()}-${idx}`;
            if (seenMistakeIds.has(mid)) {
              mid = `mdna-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seenMistakeIds.add(mid);
            return { ...m, id: mid };
          });
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load LearningTwin from storage:", err);
  }
  const initial = generateDefaultLearningTwin(studentId, studentName || "Student", avatar);
  saveStoredLearningTwin(initial);
  return initial;
}

export async function fetchCoursesApi(): Promise<Course[]> {
  try {
    const res = await fetch("/api/courses");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveStoredCourses(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch courses from API, using storage:", err);
  }
  return getStoredCourses();
}

export async function fetchAssignmentsApi(): Promise<Assignment[]> {
  try {
    const res = await fetch("/api/assignments");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveStoredAssignments(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch assignments from API, using storage:", err);
  }
  return getStoredAssignments();
}

export async function fetchQuizzesApi(): Promise<Quiz[]> {
  try {
    const res = await fetch("/api/quizzes");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveStoredQuizzes(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch quizzes from API, using storage:", err);
  }
  return getStoredQuizzes();
}

export async function fetchProjectsApi(): Promise<Project[]> {
  try {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveStoredProjects(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch projects from API, using storage:", err);
  }
  return getStoredProjects();
}

export async function createProjectApi(projectData: Partial<Project>): Promise<Project> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData)
    });
    if (res.ok) {
      const proj = await res.json();
      const current = getStoredProjects();
      saveStoredProjects([proj, ...current.filter(p => p.id !== proj.id)]);
      return proj;
    }
  } catch (err) {
    console.warn("Failed to create project via API:", err);
  }
  return projectData as Project;
}

export async function joinProjectApi(projectId: string, student: { studentId: string; studentName: string; studentAvatar?: string }): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to join project via API:", err);
    return false;
  }
}

export async function fetchDiscussionsApi(): Promise<Discussion[]> {
  try {
    const res = await fetch("/api/discussions");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveStoredDiscussions(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch discussions from API, using storage:", err);
  }
  return getStoredDiscussions();
}

export async function createDiscussionApi(thread: Partial<Discussion>): Promise<Discussion> {
  try {
    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(thread)
    });
    if (res.ok) {
      const newThread = await res.json();
      const current = getStoredDiscussions();
      saveStoredDiscussions([newThread, ...current.filter(d => d.id !== newThread.id)]);
      return newThread;
    }
  } catch (err) {
    console.warn("Failed to create discussion via API:", err);
  }
  return thread as Discussion;
}

export async function replyDiscussionApi(discussionId: string, reply: any): Promise<any> {
  try {
    const res = await fetch(`/api/discussions/${discussionId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reply)
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("Failed to reply to discussion via API:", err);
  }
  return reply;
}

export async function upvoteDiscussionApi(discussionId: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/discussions/${discussionId}/upvote`, {
      method: "POST"
    });
    if (res.ok) {
      const data = await res.json();
      return data.upvotes;
    }
  } catch (err) {
    console.warn("Failed to upvote discussion via API:", err);
  }
  return null;
}

export async function fetchLearnTwinApi(studentId: string): Promise<LearningTwinProfile | null> {
  try {
    const res = await fetch(`/api/learntwin/${studentId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.studentId) {
        saveStoredLearningTwin(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch LearnTwin from API:", err);
  }
  return null;
}

export async function fetchAllLearnTwinsApi(): Promise<LearningTwinProfile[]> {
  try {
    const res = await fetch("/api/learntwin");
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch all LearnTwins from API:", err);
  }
  return [];
}

export function saveStoredLearningTwin(profile: LearningTwinProfile): void {
  const key = `${LEARNTWIN_STORAGE_PREFIX}${profile.studentId}`;
  try {
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (err) {
    console.warn("Failed to save LearningTwin to storage:", err);
  }

  // Cross-device synchronization with SQLite backend
  try {
    fetch(`/api/learntwin/${profile.studentId}/evolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: profile.studentName,
        profile
      })
    }).catch(e => console.warn("Background LearnTwin sync warning:", e));
  } catch (e) {
    // Ignore background sync failure
  }
}

export function generateContextualSimulatorScenario(
  conceptName: string,
  mistakeType?: string,
  customReasoning?: string
): SimulatorScenario {
  const norm = conceptName.toLowerCase();

  if (norm.includes("react") || norm.includes("hook") || norm.includes("state")) {
    return {
      title: `Production Race Condition & State Synchronization: ${conceptName}`,
      description: `In a high-throughput React dashboard, multiple fast-successive user interactions trigger asynchronous state updates. How should state updates be structured to avoid stale closures and dropped updates?`,
      codeOrProblem: `// High-frequency state mutation handler
function useRealtimeFeed(initialItems = []) {
  const [items, setItems] = useState(initialItems);

  const appendIncoming = useCallback((newItem) => {
    // QUESTION: Which state mutation ensures zero dropped packets during rapid events?
    // ???
  }, []);

  return { items, appendIncoming };
}`,
      contextType: "Practical Application Sandbox",
      options: [
        `Use functional updater form: setItems(prevItems => [...prevItems, newItem]) to guarantee access to the latest state snapshot.`,
        `Directly reference current state: setItems([...items, newItem]) without dependency updates.`,
        `Mutate items in-place using items.push(newItem) and call forceUpdate().`,
        `Store items inside a global window variable and bypass React state entirely.`
      ],
      correctChoice: 0,
      explanation: customReasoning || `React state batching and asynchronous render queues require the functional updater pattern setItems(prev => ...) to avoid stale closure references and race conditions during rapid state dispatch.`,
      targetMisconception: mistakeType || "State mutation & closure mechanics"
    };
  }

  if (norm.includes("async") || norm.includes("promise") || norm.includes("event loop")) {
    return {
      title: `Microtask Scheduling & Error Resilience: ${conceptName}`,
      description: `A Node.js microservice concurrently aggregates data from three upstream third-party payment gateways. If one gateway times out, the service must return partial results without crashing or leaking unhandled rejections.`,
      codeOrProblem: `// Distributed Payment Verification Gateway
async function verifyAllGateways(orderId, providers) {
  // QUESTION: How should concurrent async tasks with potential individual failures be dispatched?
  // ???
}`,
      contextType: "Practical Application Sandbox",
      options: [
        `Use Promise.allSettled(providers.map(p => p.verify(orderId))) and filter fulfilled outcomes.`,
        `Use Promise.all(...) without try/catch so any single failure immediately drops all other valid responses.`,
        `Use a synchronous while loop with await inside each iteration blocking all concurrency.`,
        `Dispatch all requests using unawaited setTimeout callbacks without error handlers.`
      ],
      correctChoice: 0,
      explanation: customReasoning || `Promise.allSettled guarantees that all asynchronous promises settle (either resolve or reject) before resolving, preventing uncaught promise rejection crashes and allowing partial resilience.`,
      targetMisconception: mistakeType || "Concurrent async orchestration"
    };
  }

  if (norm.includes("sql") || norm.includes("database") || norm.includes("query") || norm.includes("transaction")) {
    return {
      title: `ACID Transactions & Concurrency Guard: ${conceptName}`,
      description: `During a flash sale, thousands of concurrent requests attempt to decrement the available stock for an inventory item. How do you prevent overselling and race conditions?`,
      codeOrProblem: `// E-Commerce Checkout Inventory Decrement
async function purchaseItem(db, userId, itemId, quantity) {
  // QUESTION: Which database execution pattern prevents double-spending and overselling?
  // ???
}`,
      contextType: "Practical Application Sandbox",
      options: [
        `Wrap the decrement inside a database TRANSACTION with atomic UPDATE inventory SET stock = stock - ? WHERE id = ? AND stock >= ?`,
        `Perform SELECT stock FROM inventory, check if stock > 0 in JavaScript, then run UPDATE inventory SET stock = ?`,
        `Write the purchase to a flat JSON file on disk without locking.`,
        `Disable database constraints and rely on client-side frontend validation.`
      ],
      correctChoice: 0,
      explanation: customReasoning || `Atomic database operations inside an isolated SQL transaction prevent concurrency race conditions (phantom reads and dirty writes) that occur when application code separates the read and write steps.`,
      targetMisconception: mistakeType || "Database isolation levels & concurrency"
    };
  }

  if (norm.includes("security") || norm.includes("auth") || norm.includes("jwt") || norm.includes("cors")) {
    return {
      title: `Defensive Authentication & Token Lifecycle: ${conceptName}`,
      description: `An enterprise API issues authentication tokens to browser clients. How should authorization tokens and user sessions be stored and transmitted to protect against both XSS and CSRF?`,
      codeOrProblem: `// Secure Session Authorization Setup
app.post('/api/auth/login', async (req, res) => {
  const token = generateAuthToken(user);
  // QUESTION: What is the most secure transport strategy for the token?
  // ???
});`,
      contextType: "Practical Application Sandbox",
      options: [
        `Store in an HttpOnly, Secure, SameSite=Strict cookie for session token transmission with CSRF token protection.`,
        `Store the token in window.localStorage and inject it into innerHTML headers on every page.`,
        `Pass the authentication token as an unencrypted URL query parameter in all GET requests.`,
        `Disable CORS checks and allow any origin to access authorization credentials.`
      ],
      correctChoice: 0,
      explanation: customReasoning || `HttpOnly cookies cannot be accessed by client-side JavaScript, effectively neutralizing cross-site scripting (XSS) token theft, while SameSite and CSRF tokens protect against cross-site request forgery.`,
      targetMisconception: mistakeType || "Web security token hygiene"
    };
  }

  if (norm.includes("data structure") || norm.includes("algorithm") || norm.includes("complexity") || norm.includes("tree") || norm.includes("recursion")) {
    return {
      title: `Algorithmic Scaling & Stack Safety: ${conceptName}`,
      description: `A recursive tree traversal algorithm processes deeply nested organizational hierarchies. On deep trees (depth > 20,000), it crashes with a RangeError: Maximum call stack size exceeded.`,
      codeOrProblem: `// Deep Hierarchical Graph Traversal
function traverseDeepTree(rootNode) {
  // CRASH: RangeError: Maximum call stack size exceeded
  // QUESTION: How should the algorithm be refactored for unlimited depth safety?
  // ???
}`,
      contextType: "Practical Application Sandbox",
      options: [
        `Refactor the recursive function into an iterative traversal using an explicit heap-allocated array stack or queue.`,
        `Increase Node.js default stack memory using unlimited flags without modifying code.`,
        `Catch the RangeError in a try/catch block and ignore unvisited branch nodes.`,
        `Convert all synchronous operations into nested setInterval timers.`
      ],
      correctChoice: 0,
      explanation: customReasoning || `Iterative traversal using an explicit heap-allocated stack eliminates the call-stack overflow constraint of the runtime engine, ensuring O(N) space scaling without exceeding execution stack bounds.`,
      targetMisconception: mistakeType || "Call stack mechanics & iterative transformation"
    };
  }

  // General resilient software architecture scenario
  return {
    title: `Real-World Architecture & Resilience: ${conceptName}`,
    description: `Given a critical production service implementing ${conceptName}, choose the most resilient, fault-tolerant engineering solution:`,
    codeOrProblem: `// Architectural Module: ${conceptName}
// Scenario: High-load reliability and defensive execution boundary
function processWorkload(payload) {
  // QUESTION: Identify the optimal first-principles execution pattern:
  // ???
}`,
    contextType: "Practical Application Sandbox",
    options: [
      `Implement first-principles pattern with strict boundary validation, graceful fallback handlers, and defensive error propagation for ${conceptName}.`,
      `Apply brute-force loop without edge-case guards or timeout limits.`,
      `Bypass ${conceptName} input verification and rely on default unhandled execution.`,
      `Silence all exceptions with an empty catch block and return undefined.`
    ],
    correctChoice: 0,
    explanation: customReasoning || `Mastering ${conceptName} requires robust boundary validation, explicit error propagation, and defensive architecture to ensure deterministic system stability.`,
    targetMisconception: mistakeType || "Difficulty transferring theoretical knowledge to real-world edge cases"
  };
}

/**
 * Dynamic Learning Twin Evolution Engine:
 * Updates the student's cognitive twin profile across multiple evidence dimensions
 * only when real coursework, quizzes, or assignments are completed.
 */
export function evolveLearningTwinProfile(
  studentId: string,
  event: {
    eventType: 'answered_question' | 'made_error' | 'explained_concept' | 'completed_mission' | 'asked_ai' | 'revisited_topic' | 'transfer_challenge';
    concept: string;
    isCorrect?: boolean;
    mistakeType?: MistakeType;
    studentAnswer?: string;
    correctReasoning?: string;
    confidenceLevel?: number; // 0-100%
    responseTimeSec?: number;
    explanationText?: string;
    explanationScore?: number;
    missionTitle?: string;
  }
): LearningTwinProfile {
  const twin = getStoredLearningTwin(studentId);
  const nowStr = new Date().toISOString();
  const conceptName = event.concept?.trim() || "Core Concepts";

  // 1. Concept Mastery Evolving (Multi-Evidence Bayesian Adjustment)
  const existingNode: ConceptMasteryNode = (twin.concept_mastery[conceptName] as ConceptMasteryNode) || {
    concept: conceptName,
    masteryScore: event.isCorrect ? 85 : 45,
    confidenceLevel: event.confidenceLevel || (event.isCorrect ? 80 : 50),
    evidenceCount: 1,
    retentionStability: event.isCorrect ? 85 : 50,
    transferAbility: event.isCorrect ? 80 : 40,
    lastTested: "Just now",
    predictedDecayDays: event.isCorrect ? 24 : 10
  };

  let deltaReasoning = 0;
  let deltaTransfer = 0;
  let deltaConfidence = 0;
  let deltaSummary = "";

  const isAnsweringSuccess = event.eventType === "answered_question" && event.isCorrect === true;
  const isAnsweringFailure = (event.eventType === "answered_question" && event.isCorrect === false) || event.eventType === "made_error";

  if (isAnsweringSuccess) {
    const weight = Math.max(2, 6 - Math.floor(existingNode.evidenceCount / 4));
    existingNode.masteryScore = Math.min(100, existingNode.masteryScore + weight);
    existingNode.evidenceCount += 1;
    existingNode.retentionStability = Math.min(100, existingNode.retentionStability + 3);
    existingNode.transferAbility = Math.min(100, existingNode.transferAbility + 3);
    existingNode.lastTested = "Just now";
    
    deltaReasoning = 3;
    deltaTransfer = 2;
    deltaConfidence = event.confidenceLevel && event.confidenceLevel > 70 ? 2 : 1;
    deltaSummary = `Accurately answered assessment on ${conceptName}.`;

    // If concept is now strong, remove or resolve any existing risk for this concept
    if (existingNode.masteryScore >= 75 && existingNode.transferAbility >= 70) {
      twin.predicted_risks = twin.predicted_risks.filter(r => r.concept !== conceptName);
      twin.recommended_interventions = twin.recommended_interventions.filter(r => r.concept !== conceptName);
    }
  } else if (isAnsweringFailure) {
    const drop = Math.max(3, 8 - Math.floor(existingNode.evidenceCount / 5));
    existingNode.masteryScore = Math.max(15, existingNode.masteryScore - drop);
    existingNode.transferAbility = Math.max(10, existingNode.transferAbility - 5);
    existingNode.evidenceCount += 1;
    existingNode.lastTested = "Just now";
    deltaReasoning = -2;
    deltaTransfer = -3;
    deltaSummary = `Encountered diagnostic challenge on ${conceptName} assessment.`;

    const mistakeTypeResolved = event.mistakeType || (conceptName.toLowerCase().includes("recursion") || conceptName.toLowerCase().includes("async") ? "Difficulty transferring knowledge" : "Concept misunderstanding");

    // 1. Record in Mistake DNA
    const existingDna = twin.mistake_patterns.find(m => m.concept === conceptName);
    if (existingDna) {
      existingDna.recurrenceCount += 1;
      existingDna.timestamp = nowStr;
      existingDna.studentAnswer = event.studentAnswer || existingDna.studentAnswer;
      existingDna.correctReasoning = event.correctReasoning || existingDna.correctReasoning;
      existingDna.confidence = event.confidenceLevel || existingDna.confidence;
      if (existingDna.recurrenceCount >= 2) {
        existingDna.severity = "Critical";
      }
    } else {
      twin.mistake_patterns.unshift({
        id: `mdna-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        studentId,
        concept: conceptName,
        mistakeType: mistakeTypeResolved,
        studentAnswer: event.studentAnswer || "Sub-optimal option selected",
        correctReasoning: event.correctReasoning || `Target cognitive reasoning for ${conceptName}`,
        confidence: event.confidenceLevel || 50,
        recurrenceCount: 1,
        severity: "Critical",
        recommendedIntervention: `Execute targeted simulation stress test on ${conceptName}`,
        timestamp: nowStr,
        contextType: "real_world_problem",
        resolved: false
      });
    }

    // 2. Generate Rich Simulator Scenario & Predicted Risk
    const scenario = generateContextualSimulatorScenario(conceptName, mistakeTypeResolved, event.correctReasoning);
    const riskScore = Math.max(45, Math.min(95, 100 - existingNode.masteryScore + 10));

    const newRisk: PredictedRisk = {
      id: `risk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      concept: conceptName,
      riskScore,
      reason: `Knowledge transfer gap detected during assessment. Student struggled with ${conceptName} edge-case reasoning.`,
      recommendedIntervention: `Interactive stress-test mission on ${conceptName}`,
      contextTrigger: `When applying ${conceptName} principles in production architectures without explicit prompts`,
      currentMastery: existingNode.masteryScore,
      prerequisitesMastered: [{ concept: `${conceptName} Syntax`, score: Math.min(100, existingNode.masteryScore + 15) }],
      simulatorScenario: scenario
    };

    const existingRiskIdx = twin.predicted_risks.findIndex(r => r.concept === conceptName);
    if (existingRiskIdx >= 0) {
      twin.predicted_risks[existingRiskIdx] = newRisk;
    } else {
      twin.predicted_risks.unshift(newRisk);
    }

    // 3. Add / Update Targeted Recommended Intervention
    const newInt: RecommendedIntervention = {
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: `Targeted Mission: Master ${conceptName}`,
      type: "debugging_mission",
      concept: conceptName,
      urgency: riskScore >= 65 ? "High" : "Medium",
      estimatedMinutes: 10,
      description: `Execute real-world scenario stress tests and bridge cognitive transfer gaps in ${conceptName}.`,
      missionScenario: scenario
    };

    const existingIntIdx = twin.recommended_interventions.findIndex(i => i.concept === conceptName);
    if (existingIntIdx >= 0) {
      twin.recommended_interventions[existingIntIdx] = newInt;
    } else {
      twin.recommended_interventions.unshift(newInt);
    }
  } else if (event.eventType === "completed_mission") {
    existingNode.masteryScore = Math.min(100, existingNode.masteryScore + 12);
    existingNode.transferAbility = Math.min(100, existingNode.transferAbility + 15);
    existingNode.retentionStability = Math.min(100, existingNode.retentionStability + 10);
    deltaTransfer = 5;
    deltaReasoning = 4;
    deltaSummary = `Successfully mastered stress-test simulation: ${event.missionTitle || conceptName}.`;

    // Mark corresponding mistake DNA / risk as resolved
    twin.predicted_risks = twin.predicted_risks.filter(r => r.concept !== conceptName);
    twin.recommended_interventions = twin.recommended_interventions.filter(r => r.concept !== conceptName);
    
    // Mark mistake pattern resolved
    const matchedDna = twin.mistake_patterns.find(m => m.concept === conceptName);
    if (matchedDna) {
      matchedDna.resolved = true;
    }
  }

  // Update Concept in Map
  twin.concept_mastery[conceptName] = existingNode;

  // Compute aggregate metrics from real concept data
  const conceptList = Object.values(twin.concept_mastery) as ConceptMasteryNode[];
  if (conceptList.length > 0) {
    const totalMastery = conceptList.reduce((sum, c) => sum + (c.masteryScore || 0), 0);
    const totalTransfer = conceptList.reduce((sum, c) => sum + (c.transferAbility || 0), 0);
    const totalRetention = conceptList.reduce((sum, c) => sum + (c.retentionStability || 0), 0);
    const totalConfidence = conceptList.reduce((sum, c) => sum + (c.confidenceLevel || 0), 0);

    twin.reasoning_score = Math.round(totalMastery / conceptList.length);
    twin.concept_transfer_score = Math.round(totalTransfer / conceptList.length);
    twin.retention_score = Math.round(totalRetention / conceptList.length);
    twin.confidence_score = Math.round(totalConfidence / conceptList.length);

    twin.guessing_vs_reasoning.reasoning_depth = twin.reasoning_score;
    twin.guessing_vs_reasoning.guessing_tendency = Math.max(0, 100 - twin.reasoning_score);
  }

  twin.lastUpdated = nowStr;

  // Append Behavior Log Entry
  if (deltaSummary) {
    twin.recent_behavior.unshift({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: "Just now",
      actionType: event.eventType,
      summary: deltaSummary,
      deltaImpact: `${deltaReasoning >= 0 ? '+' : ''}${deltaReasoning}% Reasoning, ${deltaTransfer >= 0 ? '+' : ''}${deltaTransfer}% Transfer`,
      concept: conceptName
    });
    twin.recent_behavior = twin.recent_behavior.slice(0, 20);
  }

  saveStoredLearningTwin(twin);
  return twin;
}

