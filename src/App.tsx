import React, { useState, useEffect } from "react";
import { 
  Role, 
  User, 
  Course, 
  Assignment, 
  Quiz, 
  Project, 
  Skill, 
  Discussion, 
  Message, 
  Certificate,
  AppNotification,
  AdminAnalytics,
  SystemComplaint
} from "./types";
import { 
  fetchUsers, 
  fetchCourses, 
  fetchAssignments, 
  fetchQuizzes, 
  fetchProjects, 
  fetchSkills, 
  fetchDiscussions, 
  fetchMessages, 
  saveStoredMessages,
  fetchCertificates,
  fetchNotifications,
  fetchAdminAnalytics,
  fetchComplaints,
  fetchComplaintsApi,
  createComplaintApi,
  updateComplaintApi,
  deleteComplaintApi,
  getStoredUsers,
  getStoredCurrentUser,
  setStoredCurrentUser,
  addOrUpdateStoredUser,
  removeStoredUser,
  saveStoredCourses,
  fetchCoursesApi,
  fetchAssignmentsApi,
  fetchQuizzesApi,
  fetchProjectsApi,
  fetchDiscussionsApi,
  fetchCertificatesApi,
  createCourseApi,
  deleteCourseApi,
  deleteUserApi,
  createAssignmentApi,
  deleteAssignmentApi,
  submitAssignmentApi,
  gradeAssignmentApi,
  createQuizApi,
  deleteQuizApi,
  saveStoredQuizzes,
  submitQuizApi,
  fetchUsersApi,
  saveUserApi,
  enrollCourseApi,
  createCertificateApi,
  evolveLearningTwinProfile
} from "./lib/api";
import { realtimeClient, playMessageChime } from "./lib/realtime";

import { AuthScreen } from "./components/AuthScreen";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { StudentDashboard } from "./components/StudentDashboard";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { FeedbackView } from "./components/FeedbackView";
import { AdminFeedbackView } from "./components/AdminFeedbackView";
import { CoursesView } from "./components/CoursesView";
import { AssignmentsView } from "./components/AssignmentsView";
import { QuizzesView } from "./components/QuizzesView";
import { ProjectsView } from "./components/ProjectsView";
import { SkillsView } from "./components/SkillsView";
import { DiscussionsView } from "./components/DiscussionsView";
import { MessagesView } from "./components/MessagesView";
import { CertificatesView } from "./components/CertificatesView";
import { StudentsRosterView } from "./components/StudentsRosterView";
import { TeacherReportsView } from "./components/TeacherReportsView";
import { AdminSettingsView } from "./components/AdminSettingsView";
import { ProfileView } from "./components/ProfileView";
import { AiAssistantModal } from "./components/AiAssistantModal";
import { LearnTwinView } from "./components/LearnTwinView";

export const App: React.FC = () => {
  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("edunex_theme") || localStorage.getItem("smartlearn_theme");
    if (saved !== null) {
      return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Authentication & User state (Opens with Sign In / Sign Up Screen)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>("STUDENT");

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [learnTwinSubTab, setLearnTwinSubTab] = useState<string>("twin");
  const [targetQuizId, setTargetQuizId] = useState<string | undefined>(undefined);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNavigateTab = (tab: string) => {
    if (tab.startsWith("learntwin:")) {
      const sub = tab.split(":")[1];
      setLearnTwinSubTab(sub);
      setActiveTab("learntwin");
    } else {
      if (tab === "learntwin") {
        setLearnTwinSubTab("twin");
      }
      setActiveTab(tab);
    }
  };

  // Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<"socratic" | "quiz" | "lesson">("socratic");

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalytics | null>(null);
  const [complaints, setComplaints] = useState<SystemComplaint[]>([]);

  // Synchronize and apply dark mode class to HTML element and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("edunex_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("edunex_theme", "light");
    }
  }, [isDarkMode]);

  // Connect real-time messaging WebSocket listener
  useEffect(() => {
    if (currentUser) {
      realtimeClient.connect(currentUser.id, currentUser.name, currentUser.role);
    }

    const unsubMsg = realtimeClient.onMessage((incomingMsg) => {
      setMessages(prev => {
        // 1. Prevent duplicate entries by exact ID
        if (prev.some(m => m.id === incomingMsg.id)) {
          return prev;
        }

        // 2. Prevent duplicate entries if identical sender, receiver, and content already added
        const isDuplicateContent = prev.some(
          m => m.senderId === incomingMsg.senderId &&
               (m.receiverId === incomingMsg.receiverId || m.recipientId === incomingMsg.receiverId || (m.receiverId === "all" && incomingMsg.receiverId === "all")) &&
               m.content.trim() === incomingMsg.content.trim() &&
               m.timestamp === incomingMsg.timestamp
        );
        if (isDuplicateContent) {
          return prev;
        }

        const updated = [...prev, incomingMsg];
        saveStoredMessages(updated);
        return updated;
      });

      // If current user is recipient (or broadcast) and not the sender, alert user
      if (currentUser && incomingMsg.senderId !== currentUser.id && (incomingMsg.receiverId === currentUser.id || incomingMsg.receiverId === "all")) {
        playMessageChime();
        setNotifications(prev => [
          {
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: incomingMsg.isAnnouncement ? "Course Announcement" : "New Direct Message",
            message: incomingMsg.content.length > 55 ? `${incomingMsg.content.slice(0, 52)}...` : incomingMsg.content,
            timeAgo: "Just now",
            read: false
          },
          ...prev
        ]);
      }
    });

    const unsubComplaint = realtimeClient.on("complaint:new", (data: any) => {
      if (data && data.complaint) {
        setComplaints(prev => {
          if (prev.some(c => c.id === data.complaint.id)) return prev;
          return [data.complaint, ...prev];
        });
      }
    });

    const unsubComplaintUpdated = realtimeClient.on("complaint:updated", (data: any) => {
      if (data && data.complaint) {
        setComplaints(prev => prev.map(c => c.id === data.complaint.id ? data.complaint : c));
      }
    });

    const unsubComplaintDeleted = realtimeClient.on("complaint:deleted", (data: any) => {
      if (data && data.id) {
        setComplaints(prev => prev.filter(c => c.id !== data.id));
      }
    });

    const unsubUserUpdate = realtimeClient.on("user:update", (data: any) => {
      if (data && data.user) {
        setUsers(prev => {
          const exists = prev.some(u => u.id === data.user.id || (u.email && u.email.toLowerCase() === data.user.email?.toLowerCase()));
          if (exists) {
            return prev.map(u => (u.id === data.user.id || (u.email && u.email.toLowerCase() === data.user.email?.toLowerCase())) ? { ...u, ...data.user } : u);
          }
          return [...prev, data.user];
        });
      } else if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      }
      setAdminAnalytics(fetchAdminAnalytics());
    });

    const unsubUserDelete = realtimeClient.on("user:delete", (data: any) => {
      if (data && data.userId) {
        setUsers(prev => prev.filter(u => u.id !== data.userId));
        setAdminAnalytics(fetchAdminAnalytics());
      }
    });

    // Courses universal multi-device listeners
    const unsubCourseNew = realtimeClient.on("course:new", (data: any) => {
      if (data && data.course) {
        setCourses(prev => {
          if (prev.some(c => c.id === data.course.id)) {
            return prev.map(c => c.id === data.course.id ? data.course : c);
          }
          return [data.course, ...prev];
        });
        setAdminAnalytics(fetchAdminAnalytics());
      } else if (data && Array.isArray(data.courses)) {
        setCourses(data.courses);
        setAdminAnalytics(fetchAdminAnalytics());
      }
    });

    const unsubCourseDeleted = realtimeClient.on("course:deleted", (data: any) => {
      if (data && (data.id || data.courseId)) {
        const targetId = data.id || data.courseId;
        setCourses(prev => prev.filter(c => c.id !== targetId));
        setAdminAnalytics(fetchAdminAnalytics());
      }
    });

    const unsubCourseEnrolled = realtimeClient.on("course:enrolled", (data: any) => {
      if (data && data.course) {
        setCourses(prev => prev.map(c => c.id === data.course.id ? data.course : c));
      }
    });

    // Assignments universal multi-device listeners
    const unsubAssignmentNew = realtimeClient.on("assignment:new", (data: any) => {
      if (data && data.assignment) {
        setAssignments(prev => {
          if (prev.some(a => a.id === data.assignment.id)) {
            return prev.map(a => a.id === data.assignment.id ? data.assignment : a);
          }
          return [data.assignment, ...prev];
        });
      }
    });

    const unsubAssignmentDeleted = realtimeClient.on("assignment:deleted", (data: any) => {
      if (data && (data.id || data.assignmentId)) {
        const targetId = data.id || data.assignmentId;
        setAssignments(prev => prev.filter(a => a.id !== targetId));
      }
    });

    const unsubAssignmentSubmitted = realtimeClient.on("assignment:submitted", (data: any) => {
      if (data && data.assignment) {
        setAssignments(prev => prev.map(a => a.id === data.assignment.id ? data.assignment : a));
      }
    });

    const unsubAssignmentGraded = realtimeClient.on("assignment:graded", (data: any) => {
      if (data && data.assignment) {
        setAssignments(prev => prev.map(a => a.id === data.assignment.id ? data.assignment : a));
      }
    });

    // Quizzes universal multi-device listeners
    const unsubQuizNew = realtimeClient.on("quiz:new", (data: any) => {
      if (data && data.quiz) {
        setQuizzes(prev => {
          if (prev.some(q => q.id === data.quiz.id)) {
            return prev.map(q => q.id === data.quiz.id ? data.quiz : q);
          }
          return [data.quiz, ...prev];
        });
      }
    });

    const unsubQuizDeleted = realtimeClient.on("quiz:deleted", (data: any) => {
      if (data && (data.id || data.quizId)) {
        const targetId = data.id || data.quizId;
        setQuizzes(prev => prev.filter(q => q.id !== targetId));
      }
    });

    // Discussions universal multi-device listeners
    const unsubDiscussionNew = realtimeClient.on("discussion:new", (data: any) => {
      if (data && data.discussion) {
        setDiscussions(prev => {
          if (prev.some(d => d.id === data.discussion.id)) return prev;
          return [data.discussion, ...prev];
        });
      }
    });

    const unsubDiscussionReply = realtimeClient.on("discussion:reply", (data: any) => {
      if (data && data.discussion) {
        setDiscussions(prev => prev.map(d => d.id === data.discussion.id ? data.discussion : d));
      }
    });

    const unsubDiscussionUpvote = realtimeClient.on("discussion:upvote", (data: any) => {
      if (data && data.discussion) {
        setDiscussions(prev => prev.map(d => d.id === data.discussion.id ? data.discussion : d));
      }
    });

    // Projects universal multi-device listeners
    const unsubProjectNew = realtimeClient.on("project:new", (data: any) => {
      if (data && data.project) {
        setProjects(prev => {
          if (prev.some(p => p.id === data.project.id)) {
            return prev.map(p => p.id === data.project.id ? data.project : p);
          }
          return [...prev, data.project];
        });
      }
    });

    const unsubProjectJoin = realtimeClient.on("project:join", (data: any) => {
      if (data && data.project) {
        setProjects(prev => prev.map(p => p.id === data.project.id ? data.project : p));
      }
    });

    // Certificates universal multi-device listeners
    const unsubCertNew = realtimeClient.on("certificate:new", (data: any) => {
      if (data && data.certificate) {
        setCertificates(prev => {
          if (prev.some(c => c.id === data.certificate.id)) return prev;
          return [data.certificate, ...prev];
        });
      }
    });

    return () => {
      unsubMsg();
      unsubComplaint();
      unsubComplaintUpdated();
      unsubComplaintDeleted();
      unsubUserUpdate();
      unsubUserDelete();
      unsubCourseNew();
      unsubCourseDeleted();
      unsubCourseEnrolled();
      unsubAssignmentNew();
      unsubAssignmentDeleted();
      unsubAssignmentSubmitted();
      unsubAssignmentGraded();
      unsubQuizNew();
      unsubQuizDeleted();
      unsubDiscussionNew();
      unsubDiscussionReply();
      unsubDiscussionUpvote();
      unsubProjectNew();
      unsubProjectJoin();
      unsubCertNew();
    };
  }, [currentUser]);

  // Load initial data
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    setUsers(loadedUsers);

    // Fetch latest users from backend SQLite (cross-device sync)
    fetchUsersApi().then(serverUsers => {
      if (serverUsers && serverUsers.length > 0) {
        setUsers(serverUsers);
      }
    }).catch(err => console.warn("Failed to load server users:", err));

    // Check if user is already signed in from a previous session
    const storedActiveUser = getStoredCurrentUser();
    if (storedActiveUser) {
      setCurrentUser(storedActiveUser);
      setCurrentRole(storedActiveUser.role);
      setIsAuthenticated(true);
    } else {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }

    // Load initial local states
    setCourses(fetchCourses());
    setAssignments(fetchAssignments());
    setQuizzes(fetchQuizzes());
    setProjects(fetchProjects());
    setSkills(fetchSkills());
    setDiscussions(fetchDiscussions());
    setMessages(fetchMessages());
    setCertificates(fetchCertificates());
    setNotifications(fetchNotifications());
    setAdminAnalytics(fetchAdminAnalytics());
    setComplaints(fetchComplaints());

    // Fetch live data from backend SQLite endpoints for cross-device universal visibility
    fetchCoursesApi().then(data => {
      if (data) {
        setCourses(data);
        setAdminAnalytics(fetchAdminAnalytics());
      }
    });

    fetchAssignmentsApi().then(data => {
      if (data) setAssignments(data);
    });

    fetchQuizzesApi().then(data => {
      if (data) setQuizzes(data);
    });

    fetchProjectsApi().then(data => {
      if (data) setProjects(data);
    });

    fetchDiscussionsApi().then(data => {
      if (data) setDiscussions(data);
    });

    fetchCertificatesApi().then(data => {
      if (data) setCertificates(data);
    });

    fetchComplaintsApi().then(data => {
      if (data && data.length > 0) {
        setComplaints(data);
      }
    });
  }, []);

  // Handle Login
  const handleLogin = (user: User) => {
    setStoredCurrentUser(user);
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsAuthenticated(true);
    setActiveTab("dashboard");
  };

  // Handle Sign Up
  const handleSignUp = async (newUser: User) => {
    const updatedUsers = addOrUpdateStoredUser(newUser);
    setUsers(updatedUsers);
    setStoredCurrentUser(newUser);
    setCurrentUser(newUser);
    setCurrentRole(newUser.role);
    setIsAuthenticated(true);
    setActiveTab("dashboard");

    // Sync to SQLite on server & broadcast to all connected devices/admins
    try {
      await saveUserApi(newUser);
    } catch (err) {
      console.warn("Failed to sync new user to server:", err);
    }
    setAdminAnalytics(fetchAdminAnalytics());
  };

  // Handle Logout
  const handleLogout = () => {
    setStoredCurrentUser(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Handle Role Switch inside Dashboard
  const handleRoleChange = (newRole: Role) => {
    setCurrentRole(newRole);
    const matchedUser = users.find(u => String(u.role).toLowerCase() === String(newRole).toLowerCase());
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setStoredCurrentUser(matchedUser);
    }
    // Reset to dashboard on role change
    setActiveTab("dashboard");
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Open AI Assistant with specific mode
  const handleOpenAiAssistant = (mode: "socratic" | "quiz" | "lesson" = "socratic") => {
    setAiModalMode(mode);
    setIsAiModalOpen(true);
  };

  // Course handlers
  const handleEnrollCourse = async (courseId: string) => {
    setCourses(prev => {
      const updated = prev.map(c =>
        c.id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c
      );
      saveStoredCourses(updated);
      return updated;
    });

    if (currentUser) {
      const updatedEnrolled = currentUser.enrolledCourseIds || [];
      if (!updatedEnrolled.includes(courseId)) {
        const updatedUser = {
          ...currentUser,
          enrolledCourseIds: [...updatedEnrolled, courseId]
        };
        setCurrentUser(updatedUser);
        setStoredCurrentUser(updatedUser);
        addOrUpdateStoredUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

        try {
          await enrollCourseApi(courseId, currentUser.id);
          await saveUserApi(updatedUser);
        } catch (err) {
          console.warn("Error syncing enrollment:", err);
        }
      }
    }
    alert("Successfully enrolled in course!");
  };

  const handleCreateCourse = async (newCourseData: Partial<Course>) => {
    const newCourse: Course = {
      id: newCourseData.id || `c-${Date.now()}`,
      title: newCourseData.title || "Untitled Course",
      description: newCourseData.description || "",
      category: newCourseData.category || "General",
      instructorId: currentUser?.id || "",
      instructorName: currentUser?.name || "Instructor",
      instructorAvatar: currentUser?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      thumbnail: newCourseData.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600",
      enrolledCount: 0,
      rating: 5.0,
      lessonsCount: newCourseData.lessons?.length || 1,
      duration: newCourseData.duration || "4 Hours",
      level: newCourseData.level || "Beginner",
      lessons: newCourseData.lessons || [
        { id: `l-${Date.now()}-1`, title: "Module 1: Overview & Objectives", duration: "30 min", type: "video", completed: false }
      ],
      resources: newCourseData.resources || [],
      skillsTaught: newCourseData.skillsTaught || ["Core Principles"],
      createdAt: new Date().toISOString()
    };

    // Save to SQLite server backend
    await createCourseApi(newCourse);

    setCourses(prev => {
      const updated = [newCourse, ...prev.filter(c => c.id !== newCourse.id)];
      saveStoredCourses(updated);
      return updated;
    });

    // Post notification for students
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: "New Course Published",
        message: `"${newCourse.title}" is now open for enrollment with video modules & study files.`,
        timeAgo: "Just now",
        read: false
      },
      ...prev
    ]);

    alert("Course published successfully and stored in SQLite3!");
  };

  const handleDeleteCourse = async (courseId: string) => {
    // Delete from SQLite server backend and cleanup associated files
    await deleteCourseApi(courseId);

    setCourses(prev => {
      const updated = prev.filter(c => c.id !== courseId);
      saveStoredCourses(updated);
      return updated;
    });

    // Remove course enrollment from current user if enrolled
    if (currentUser?.enrolledCourseIds?.includes(courseId)) {
      const updatedUser = {
        ...currentUser,
        enrolledCourseIds: currentUser.enrolledCourseIds.filter(id => id !== courseId)
      };
      setCurrentUser(updatedUser);
      setStoredCurrentUser(updatedUser);
      addOrUpdateStoredUser(updatedUser);
    }

    alert("Course and its SQLite uploads have been successfully deleted.");
  };

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    const targetName = targetUser ? targetUser.name : "User";
    const targetRole = targetUser ? String(targetUser.role).toUpperCase() : "ACCOUNT";

    // Call server SQLite delete endpoint with current authenticated role
    const res = await deleteUserApi(userId, currentRole);
    if (!res.success && res.error) {
      alert(res.error);
      return;
    }

    // Remove from localStorage
    removeStoredUser(userId);

    // Update state
    setUsers(prev => prev.filter(u => u.id !== userId));

    // If current logged-in user deleted their own account
    if (currentUser?.id === userId) {
      handleLogout();
      alert("Your account has been permanently removed.");
      return;
    }

    // Refresh admin analytics
    setAdminAnalytics(fetchAdminAnalytics());

    alert(`Account for "${targetName}" (${targetRole}) has been successfully deleted.`);
  };

  // Assignment handlers
  const handleSubmitAssignment = async (assignmentId: string, submissionData: any) => {
    const studentId = currentUser?.id || "usr-1";
    const studentName = currentUser?.name || "Student";
    const studentAvatar = currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";

    const isSimpleString = typeof submissionData === "string";
    const content = isSimpleString ? submissionData : submissionData.content || "";
    const fileUrl = !isSimpleString ? submissionData.fileUrl : undefined;
    const fileName = !isSimpleString ? submissionData.fileName : undefined;
    const fileType = !isSimpleString ? submissionData.fileType : undefined;
    const fileSize = !isSimpleString ? submissionData.fileSize : undefined;
    const attachments = !isSimpleString ? submissionData.attachments : undefined;

    const payload = {
      studentId,
      studentName,
      studentAvatar,
      content,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      attachments,
      status: "SUBMITTED" as const,
      submittedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await submitAssignmentApi(assignmentId, payload);
    } catch (err) {
      console.warn("Backend submit fallback:", err);
    }

    // Evolve student's LearnTwin with assignment submission
    const targetAssn = assignments.find(a => a.id === assignmentId);
    const conceptName = targetAssn?.courseTitle || targetAssn?.title || "Practical Assignment";
    evolveLearningTwinProfile(studentId, {
      eventType: "answered_question",
      concept: conceptName,
      isCorrect: true,
      confidenceLevel: 85
    });

    setAssignments(prev =>
      prev.map(a => {
        if (a.id === assignmentId) {
          const currentSubs = a.submissions || [];
          const existingIdx = currentSubs.findIndex(s => s.studentId === studentId);
          let newSubs = [...currentSubs];
          if (existingIdx >= 0) {
            newSubs[existingIdx] = { ...newSubs[existingIdx], ...payload };
          } else {
            newSubs.push(payload);
          }

          return {
            ...a,
            status: "SUBMITTED" as const,
            submissions: newSubs
          };
        }
        return a;
      })
    );
  };

  const handleGradeSubmission = async (
    assignmentId: string, 
    submissionId: string, 
    grade: number, 
    feedback: string,
    gradedFileUrl?: string,
    gradedFileName?: string,
    gradedFileType?: "pdf" | "image" | "file"
  ) => {
    try {
      await gradeAssignmentApi({
        assignmentId,
        submissionId,
        studentId: submissionId,
        grade,
        feedback,
        gradedFileUrl,
        gradedFileName,
        gradedFileType
      });
    } catch (err) {
      console.warn("Backend grade fallback:", err);
    }

    // Evolve student's LearnTwin based on teacher assessment
    const targetAssn = assignments.find(a => a.id === assignmentId);
    const conceptName = targetAssn?.courseTitle || targetAssn?.title || "Assignment Review";
    const isPassing = grade >= 60;
    evolveLearningTwinProfile(submissionId, {
      eventType: isPassing ? "answered_question" : "made_error",
      concept: conceptName,
      isCorrect: isPassing,
      mistakeType: isPassing ? undefined : "Concept misunderstanding",
      studentAnswer: feedback ? `Submission: ${feedback}` : `Grade: ${grade}%`,
      correctReasoning: feedback || "Teacher curriculum evaluation standards",
      confidenceLevel: grade
    });

    setAssignments(prev =>
      prev.map(a => {
        if (a.id === assignmentId) {
          const updatedSubs = (a.submissions || []).map(sub => {
            if (sub.studentId === submissionId || (sub as any).id === submissionId) {
              return {
                ...sub,
                grade,
                feedback,
                gradedFileUrl: gradedFileUrl || sub.gradedFileUrl,
                gradedFileName: gradedFileName || sub.gradedFileName,
                gradedFileType: gradedFileType || sub.gradedFileType,
                status: "GRADED" as const
              };
            }
            return sub;
          });
          return { ...a, submissions: updatedSubs };
        }
        return a;
      })
    );
  };

  const handleCreateAssignment = async (newAssignment: Partial<Assignment>) => {
    const a: Assignment = {
      id: `a-${Date.now()}`,
      courseId: newAssignment.courseId || "c-1",
      courseTitle: newAssignment.courseTitle || "Web Development",
      title: newAssignment.title || "Untitled Assignment",
      description: newAssignment.description || "",
      deadline: newAssignment.deadline || "In 1 week",
      totalPoints: newAssignment.totalPoints || 100,
      instructorId: currentUser?.id,
      instructorName: currentUser?.name,
      attachments: newAssignment.attachments || [],
      status: "PENDING",
      submissions: []
    };

    try {
      const created = await createAssignmentApi(a);
      setAssignments(prev => [created || a, ...prev]);
    } catch (err) {
      setAssignments(prev => [a, ...prev]);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignmentApi(assignmentId);
    } catch (err) {
      console.warn("Backend delete assignment fallback:", err);
    }
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  // Quiz handlers
  const handleCompleteQuiz = (quizId: string, score: number) => {
    setQuizzes(prev => {
      const updated = prev.map(q =>
        q.id === quizId ? { ...q, isCompleted: true, score } : q
      );
      saveStoredQuizzes(updated);
      return updated;
    });
  };

  const handleCreateQuiz = async (newQuiz: Partial<Quiz>) => {
    const q: Quiz = {
      id: newQuiz.id || `quiz-${Date.now()}`,
      courseId: newQuiz.courseId || "c-1",
      courseTitle: newQuiz.courseTitle || "General Course",
      title: newQuiz.title || "New Course Assessment",
      timeLimitMinutes: newQuiz.timeLimitMinutes || 15,
      type: newQuiz.type || (currentRole === "TEACHER" ? "teacher_uploaded" : "ai_generated"),
      difficulty: newQuiz.difficulty || "Intermediate",
      instructorId: currentUser?.id,
      instructorName: newQuiz.instructorName || (currentRole === "TEACHER" ? currentUser?.name || "Teacher" : "EduNex AI Mentor"),
      instructorAvatar: newQuiz.instructorAvatar || currentUser?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100",
      createdAt: new Date().toISOString(),
      totalPoints: newQuiz.totalPoints || (newQuiz.questions?.length ? newQuiz.questions.length * 10 : 70),
      tags: newQuiz.tags || ["Course Assessment"],
      description: newQuiz.description || "",
      questions: newQuiz.questions || []
    };

    try {
      const saved = await createQuizApi(q);
      const finalQ = saved || q;
      setQuizzes(prev => {
        const updated = [finalQ, ...prev.filter(item => item.id !== finalQ.id)];
        saveStoredQuizzes(updated);
        return updated;
      });
    } catch (err) {
      setQuizzes(prev => {
        const updated = [q, ...prev.filter(item => item.id !== q.id)];
        saveStoredQuizzes(updated);
        return updated;
      });
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const res = await deleteQuizApi(quizId, currentRole);
      if (!res.success && res.error) {
        alert(res.error);
        return;
      }
    } catch (err) {
      console.warn("Backend delete quiz fallback:", err);
    }

    setQuizzes(prev => {
      const updated = prev.filter(q => q.id !== quizId);
      saveStoredQuizzes(updated);
      return updated;
    });

    alert("Quiz assessment has been successfully removed.");
  };

  // Redirect to course-specific quiz when student completes a course
  const handleCompleteCourseAndTakeQuiz = (course: Course) => {
    let match = quizzes.find(q => 
      q.courseId === course.id || 
      q.title.toLowerCase() === course.title.toLowerCase() ||
      (q.courseTitle && q.courseTitle.toLowerCase() === course.title.toLowerCase())
    );

    if (!match) {
      match = {
        id: `quiz-course-${course.id}`,
        courseId: course.id,
        courseTitle: course.title,
        title: course.title,
        timeLimitMinutes: 15,
        type: "teacher_uploaded",
        difficulty: course.level === "Advanced" ? "Advanced" : course.level === "Intermediate" ? "Intermediate" : "Beginner",
        instructorId: course.instructorId || currentUser?.id,
        instructorName: course.instructorName || "Academic Faculty",
        instructorAvatar: course.instructorAvatar || currentUser?.avatar,
        createdAt: new Date().toISOString(),
        totalPoints: 60,
        tags: [course.category || "Course Assessment", ...(course.skillsTaught || ["Core Mastery"])],
        description: `Comprehensive final certification exam for ${course.title}. Score 85% or higher to earn an official autogenerated certificate.`,
        questions: [
          {
            id: `q-${course.id}-1`,
            question: `What is the primary architectural principle of ${course.title}?`,
            options: [
              `Modular component structure with strong type safety and clean interfaces.`,
              `Monolithic single-file spaghetti code without boundaries.`,
              `Hardcoding secrets directly inside client-side bundles.`,
              `Ignoring error handling and promise rejections.`
            ],
            correctAnswer: 0,
            explanation: `Modular architecture and strong contracts ensure long-term maintainability and high system resilience in ${course.title}.`,
            topic: "Core Principles"
          },
          {
            id: `q-${course.id}-2`,
            question: `How should state and data consistency be preserved across ${course.title}?`,
            options: [
              `Directly mutating global variables indiscriminately.`,
              `Unidirectional data flow with explicit event-driven updates.`,
              `Relying on arbitrary timing delays and timeouts.`,
              `Disabling state persistence completely.`
            ],
            correctAnswer: 1,
            explanation: `Unidirectional data flow guarantees predictable state transitions, reproducible diagnostics, and modular testing.`,
            topic: "State Management"
          },
          {
            id: `q-${course.id}-3`,
            question: `What is the most effective optimization pattern in high-scale scenarios?`,
            options: [
              `Intelligent memoization, lazy loading of resources, and asynchronous chunking.`,
              `Running heavy synchronous processing loops on the main thread.`,
              `Bundling uncompressed unminified source assets.`,
              `Bypassing all browser and edge caching layers.`
            ],
            correctAnswer: 0,
            explanation: `Lazy loading and targeted memoization keep execution overhead minimal and latency low.`,
            topic: "Performance & Scaling"
          },
          {
            id: `q-${course.id}-4`,
            question: `Which security protocol is essential for authenticated enterprise workflows?`,
            options: [
              `Enforcing role-based access control, cryptographic verification, and payload sanitization.`,
              `Allowing arbitrary unauthenticated access to admin endpoints.`,
              `Disabling TLS certificate verification in production.`,
              `Storing plaintext passwords in client local cache.`
            ],
            correctAnswer: 0,
            explanation: `Role-based permissions and strict sanitization at all integration points protect against unauthorized data tampering.`,
            topic: "Security Architecture"
          },
          {
            id: `q-${course.id}-5`,
            question: `In production engineering, how should regressions and edge-case defects be prevented?`,
            options: [
              `Comprehensive automated testing pipelines (unit, integration, regression suites).`,
              `Deploying code without running verification builds.`,
              `Suppressing lint and typecheck alerts.`,
              `Manually testing one happy path only.`
            ],
            correctAnswer: 0,
            explanation: `Automated test pipelines validate contracts and catch regressions before any release.`,
            topic: "Quality Assurance"
          },
          {
            id: `q-${course.id}-6`,
            question: `What is the optimal methodology for telemetry and exception resolution?`,
            options: [
              `Structured logging with correlated trace identifiers and actionable diagnostic context.`,
              `Silently swallowing runtime errors without logging.`,
              `Printing meaningless console statements without timestamps.`,
              `Disabling system monitors upon receiving high load.`
            ],
            correctAnswer: 0,
            explanation: `Correlated logs and error telemetry allow engineers to quickly detect and resolve production anomalies.`,
            topic: "Monitoring & Observability"
          }
        ]
      };

      setQuizzes(prev => {
        const updated = [match!, ...prev.filter(q => q.id !== match!.id)];
        saveStoredQuizzes(updated);
        return updated;
      });
    }

    setTargetQuizId(match.id);
    setActiveTab("quizzes");
  };

  // Project handlers
  const handleJoinProject = (projectId: string) => {
    if (!currentUser) return;
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const exists = (p.members || []).some(m => m.studentId === currentUser.id);
          if (!exists) {
            return {
              ...p,
              members: [
                ...(p.members || []),
                { studentId: currentUser.id, studentName: currentUser.name, studentAvatar: currentUser.avatar }
              ]
            };
          }
        }
        return p;
      })
    );
    alert("Joined team project!");
  };

  const handleCreateProject = (projectData: Partial<Project>) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: projectData.title || "Untitled Project",
      description: projectData.description || "",
      category: projectData.category || "Web Dev",
      members: projectData.members || [],
      milestones: projectData.milestones || [],
      repoUrl: projectData.repoUrl,
      demoUrl: projectData.demoUrl
    };
    setProjects([newProj, ...projects]);
  };

  // Discussion handler
  const handleCreateDiscussion = (discData: Partial<Discussion>) => {
    const newDisc: Discussion = {
      id: `disc-${Date.now()}`,
      title: discData.title || "New Discussion",
      content: discData.content || "",
      category: discData.category || "General",
      tags: discData.tags || [],
      authorName: currentUser?.name || "User",
      authorAvatar: currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      authorRole: currentRole,
      createdAt: "Just now",
      upvotes: 0,
      repliesCount: 0,
      isResolved: false
    };
    setDiscussions([newDisc, ...discussions]);
  };

  // Message handler
  const handleSendMessage = (
    senderId: string, 
    receiverId: string, 
    content: string, 
    isAnnouncement?: boolean, 
    courseId?: string
  ) => {
    if (!content || !content.trim()) return;

    const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const senderUser = users.find(u => u.id === senderId) || currentUser;

    const newMsg: Message = {
      id: msgId,
      senderId,
      receiverId: receiverId || "all",
      recipientId: receiverId || "all",
      content: content.trim(),
      text: content.trim(),
      senderName: senderUser?.name || currentUser?.name || "User",
      senderRole: senderUser?.role || currentRole,
      senderAvatar: senderUser?.avatar || currentUser?.avatar,
      isAnnouncement: Boolean(isAnnouncement),
      courseId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      isRead: false
    };
    
    // Optimistic local state update
    setMessages(prev => {
      if (prev.some(m => m.id === newMsg.id)) return prev;
      const updated = [...prev, newMsg];
      saveStoredMessages(updated);
      return updated;
    });

    // Broadcast over WebSocket (or fallback HTTP route if offline)
    realtimeClient.sendMessage(senderId, receiverId || "all", content.trim(), msgId, isAnnouncement, courseId);
  };

  // Complaint / Feedback Handlers
  const handleCreateComplaint = async (newTicketData: Partial<SystemComplaint>) => {
    const created = await createComplaintApi(newTicketData);
    setComplaints(prev => {
      if (prev.some(c => c.id === created.id)) return prev;
      return [created, ...prev];
    });
  };

  const handleUpdateComplaint = async (id: string, updates: { status?: string; adminReply?: string; adminName?: string }) => {
    const updated = await updateComplaintApi(id, updates);
    if (updated) {
      setComplaints(prev => prev.map(c => c.id === id ? updated : c));
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    await deleteComplaintApi(id);
    setComplaints(prev => prev.filter(c => c.id !== id));
  };

  // If not authenticated, render the Opening Sign Up / Login Screen
  if (!isAuthenticated || !currentUser) {
    return (
      <AuthScreen
        users={users}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        darkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        users={users}
        onUserSwitch={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
        }}
        darkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
        notifications={notifications}
        onToggleSidebarMobile={() => setMobileSidebarOpen(prev => !prev)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <>
              {String(currentRole).toUpperCase() === "STUDENT" && (
                <StudentDashboard
                  currentUser={currentUser}
                  courses={courses}
                  assignments={assignments}
                  quizzes={quizzes}
                  skills={skills}
                  messages={messages}
                  certificates={certificates}
                  onNavigateTab={setActiveTab}
                  onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
                />
              )}
              {String(currentRole).toUpperCase() === "TEACHER" && (
                <TeacherDashboard
                  currentUser={currentUser}
                  courses={courses}
                  assignments={assignments}
                  users={users}
                  certificates={certificates}
                  onNavigateTab={setActiveTab}
                  onOpenAiAssistant={() => handleOpenAiAssistant("lesson")}
                  onSendBroadcast={(text, courseId) => {
                    handleSendMessage(currentUser.id, "all", text, true, courseId);
                  }}
                  onDeleteStudent={handleDeleteUser}
                />
              )}
              {String(currentRole).toUpperCase() === "ADMIN" && (
                <AdminDashboard
                  analytics={adminAnalytics}
                  users={users}
                  courses={courses}
                  complaints={complaints}
                  currentUser={currentUser || undefined}
                  onApproveTeacher={(teacherId) => {
                    setUsers(prev => prev.map(u => u.id === teacherId ? { ...u, approved: true } : u));
                  }}
                  onDeleteUser={handleDeleteUser}
                  onNavigateTab={setActiveTab}
                />
              )}
            </>
          )}

          {activeTab === "learntwin" && (
            <LearnTwinView
              currentUser={currentUser}
              userRole={currentRole}
              users={users}
              courses={courses}
              initialSubTab={learnTwinSubTab}
              onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === "courses" && (
            <CoursesView
              courses={courses}
              currentUser={currentUser}
              userRole={currentRole}
              onEnroll={handleEnrollCourse}
              onCreateCourse={handleCreateCourse}
              onDeleteCourse={handleDeleteCourse}
              onCompleteCourseAndTakeQuiz={handleCompleteCourseAndTakeQuiz}
              onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
            />
          )}

          {activeTab === "assignments" && (
            <AssignmentsView
              assignments={assignments}
              courses={courses}
              currentUser={currentUser}
              userRole={currentRole}
              onSubmitAssignment={handleSubmitAssignment}
              onGradeAssignment={handleGradeSubmission}
              onCreateAssignment={handleCreateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
            />
          )}

          {activeTab === "quizzes" && (
            <QuizzesView
              quizzes={quizzes}
              courses={courses}
              currentUser={currentUser}
              userRole={currentRole}
              initialQuizId={targetQuizId}
              onNavigateTab={handleNavigateTab}
              onSubmitQuiz={async (quizId, answers) => {
                const q = quizzes.find(item => item.id === quizId);
                let correct = 0;
                const weakTopics: string[] = [];

                if (q && q.questions) {
                  q.questions.forEach(ques => {
                    const isCorrect = answers[ques.id] === ques.correctAnswer;
                    if (isCorrect) {
                      correct++;
                      if (currentUser?.id) {
                        evolveLearningTwinProfile(currentUser.id, {
                          eventType: "answered_question",
                          concept: ques.topic || q.title || "Core Programming",
                          isCorrect: true,
                          confidenceLevel: 85
                        });
                      }
                    } else {
                      if (ques.topic && !weakTopics.includes(ques.topic)) {
                        weakTopics.push(ques.topic);
                      }
                      if (currentUser?.id) {
                        evolveLearningTwinProfile(currentUser.id, {
                          eventType: "made_error",
                          concept: ques.topic || q.title || "Core Programming",
                          mistakeType: ques.topic?.includes("Recursion") || ques.topic?.includes("Async") ? "Difficulty transferring knowledge" : "Concept misunderstanding",
                          studentAnswer: ques.options ? (ques.options[answers[ques.id]] || `Option ${answers[ques.id]}`) : "Incorrect option",
                          correctReasoning: ques.explanation || `Core principles for ${ques.topic || q.title}`,
                          confidenceLevel: 55
                        });
                      }
                    }
                  });
                }
                const maxScore = q?.questions?.length || 1;
                const percentage = Math.round((correct / maxScore) * 100);
                handleCompleteQuiz(quizId, percentage);

                // Dispatch storage event to alert LearnTwin and other components
                try {
                  window.dispatchEvent(new Event("storage"));
                } catch {
                  // ignore
                }

                let certificateCreated = false;
                // If student scored >= 85%, autogenerate official verified certificate
                if (percentage >= 85 && currentUser && String(currentUser.role).toUpperCase() === "STUDENT") {
                  const courseId = q?.courseId || "c-1";
                  const matchedCourse = courses.find(c => c.id === courseId || c.title.toLowerCase() === q?.courseTitle?.toLowerCase());
                  const courseTitle = matchedCourse?.title || q?.courseTitle || q?.title || "Certified Course";

                  const newCert: Certificate = {
                    id: `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    certificateId: `EDX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                    studentId: currentUser.id,
                    studentName: currentUser.name,
                    courseId: courseId,
                    courseTitle: courseTitle,
                    issueHash: `SHA256-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                    issueDate: new Date().toISOString().split("T")[0],
                    teacherName: q?.instructorName || matchedCourse?.instructorName || "Academic Faculty",
                    scorePercent: percentage,
                    skillsVerified: q?.tags || matchedCourse?.skillsTaught || ["Course Mastery", "Assessment Honors"],
                    skillsEarned: q?.tags || matchedCourse?.skillsTaught || ["Course Mastery"]
                  };

                  try {
                    await createCertificateApi(newCert);
                  } catch (err) {
                    console.warn("Backend certificate save fallback:", err);
                  }

                  setCertificates(prev => [
                    newCert,
                    ...prev.filter(c => !(c.studentId === newCert.studentId && (c.courseId === newCert.courseId || c.courseTitle.toLowerCase() === newCert.courseTitle.toLowerCase())))
                  ]);
                  certificateCreated = true;

                  // Post notification
                  setNotifications(prev => [
                    {
                      id: `notif-${Date.now()}`,
                      title: "🏆 Official Certificate Issued!",
                      message: `You earned an official certificate for "${courseTitle}" with a score of ${percentage}%.`,
                      timeAgo: "Just now",
                      read: false
                    },
                    ...prev
                  ]);
                }

                // Build tailored diagnostic feedback
                const revisionList = weakTopics.length > 0
                  ? weakTopics.map(t => `Dedicate 20 minutes to review ${t} code patterns and diagnostic exercises.`)
                  : [
                      "Outstanding mastery! Maintain this momentum by tackling advanced architecture challenges.",
                      "Review optimal edge cases in asynchronous state management."
                    ];

                return {
                  score: correct,
                  maxScore,
                  percentage,
                  certificateCreated,
                  suggestedRevision: revisionList
                };
              }}
              onCreateQuiz={handleCreateQuiz}
              onDeleteQuiz={handleDeleteQuiz}
              onOpenAiAssistant={() => handleOpenAiAssistant("quiz")}
            />
          )}

          {activeTab === "projects" && (
            <ProjectsView
              projects={projects}
              currentUser={currentUser}
              userRole={currentRole}
              onJoinProject={handleJoinProject}
              onCreateProject={handleCreateProject}
              onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
            />
          )}

          {activeTab === "skills" && (
            <SkillsView
              skills={skills}
              currentUser={currentUser}
              userRole={currentRole}
              onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
            />
          )}

          {activeTab === "students" && String(currentRole).toUpperCase() === "TEACHER" && (
            <StudentsRosterView
              students={users}
              courses={courses}
              assignments={assignments}
              currentUser={currentUser}
              onSendMessage={(receiverId, text) => {
                handleSendMessage(currentUser.id, receiverId, text);
              }}
              onOpenAiAssistant={() => handleOpenAiAssistant("lesson")}
              onDeleteStudent={handleDeleteUser}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "reports" && String(currentRole).toUpperCase() === "TEACHER" && (
            <TeacherReportsView
              courses={courses}
              assignments={assignments}
              quizzes={quizzes}
              students={users}
              onOpenAiAssistant={() => handleOpenAiAssistant("lesson")}
            />
          )}

          {(activeTab === "users" || activeTab === "analytics") && String(currentRole).toUpperCase() === "ADMIN" && (
            <AdminDashboard
              analytics={adminAnalytics}
              users={users}
              courses={courses}
              complaints={complaints}
              currentUser={currentUser || undefined}
              onApproveTeacher={(teacherId) => {
                setUsers(prev => prev.map(u => u.id === teacherId ? { ...u, approved: true } : u));
              }}
              onDeleteUser={handleDeleteUser}
              onCreateUser={(newUser) => {
                const updatedUsers = addOrUpdateStoredUser(newUser);
                setUsers(updatedUsers);
                setAdminAnalytics(fetchAdminAnalytics());
                alert(`Account for "${newUser.name}" (${newUser.role}, ID: ${newUser.officialId || newUser.id}) has been created successfully.`);
              }}
              onUpdateComplaint={handleUpdateComplaint}
              onDeleteComplaint={handleDeleteComplaint}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "complaints" && String(currentRole).toUpperCase() === "ADMIN" && (
            <AdminFeedbackView
              currentUser={currentUser}
              complaints={complaints}
              courses={courses}
              onUpdateComplaint={handleUpdateComplaint}
              onDeleteComplaint={handleDeleteComplaint}
              onRefreshComplaints={async () => {
                const fresh = await fetchComplaintsApi();
                setComplaints(fresh);
              }}
            />
          )}

          {activeTab === "feedback" && (
            <FeedbackView
              currentUser={currentUser}
              courses={courses}
              complaints={complaints}
              userRole={currentRole}
              onSubmitFeedback={handleCreateComplaint}
              onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
            />
          )}

          {activeTab === "settings" && String(currentRole).toUpperCase() === "ADMIN" && (
            <AdminSettingsView />
          )}

          {activeTab === "discussions" && (
            <DiscussionsView
              discussions={discussions}
              currentUser={currentUser}
              userRole={currentRole}
              onCreateDiscussion={handleCreateDiscussion}
              onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
            />
          )}

          {activeTab === "messages" && (
            <MessagesView
              messages={messages}
              currentUser={currentUser}
              users={users}
              onSendMessage={handleSendMessage}
            />
          )}

          {activeTab === "certificates" && (
            <CertificatesView
              certificates={certificates}
              currentUser={currentUser}
              userRole={currentRole}
              courses={courses}
              users={users}
              complaints={complaints}
              onUpdateComplaint={handleUpdateComplaint}
              onDeleteComplaint={handleDeleteComplaint}
              onNavigateTab={setActiveTab}
              onOpenAiAssistant={() => handleOpenAiAssistant("socratic")}
            />
          )}

          {activeTab === "profile" && (
            <ProfileView
              currentUser={currentUser}
              userRole={currentRole}
              onUpdateBio={(newBio) => {
                if (!currentUser) return;
                const updated = { ...currentUser, bio: newBio };
                setCurrentUser(updated);
                setStoredCurrentUser(updated);
                addOrUpdateStoredUser(updated);
                setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
              }}
              onUpdateAvatar={(newAvatar) => {
                if (!currentUser) return;
                const updated = { ...currentUser, avatar: newAvatar };
                setCurrentUser(updated);
                setStoredCurrentUser(updated);
                addOrUpdateStoredUser(updated);
                setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
              }}
            />
          )}
        </main>
      </div>

      {/* Gemini AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        userRole={currentRole}
        initialMode={aiModalMode}
      />
    </div>
  );
};

export default App;
