import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "edunex.sqlite");
const LEGACY_DB_PATH = path.join(DATA_DIR, "smartlearn.sqlite");
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let dbInstance: Database | null = null;

export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  const targetPath = fs.existsSync(DB_PATH) 
    ? DB_PATH 
    : fs.existsSync(LEGACY_DB_PATH) 
      ? LEGACY_DB_PATH 
      : null;

  if (targetPath) {
    try {
      const fileBuffer = fs.readFileSync(targetPath);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn("Failed to load existing SQLite database, creating fresh one:", err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize SQLite Tables
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      resource_type TEXT, -- 'video' | 'pdf' | 'presentation' | 'code' | 'other'
      created_at TEXT NOT NULL
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      level TEXT,
      instructor_id TEXT,
      instructor_name TEXT,
      instructor_avatar TEXT,
      thumbnail TEXT,
      duration TEXT,
      enrolled_count INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      lessons_json TEXT,
      resources_json TEXT,
      skills_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      title TEXT,
      avatar TEXT,
      official_id TEXT,
      approved INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      enrolled_courses_json TEXT,
      goals_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  try {
    dbInstance.run("ALTER TABLE users ADD COLUMN official_id TEXT;");
  } catch (e) {
    // Column already exists, safe to ignore
  }

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      student_official_id TEXT,
      student_name TEXT NOT NULL,
      student_email TEXT,
      student_avatar TEXT,
      course_id TEXT,
      course_title TEXT,
      category TEXT,
      priority TEXT,
      rating INTEGER DEFAULT 5,
      issue TEXT NOT NULL,
      status TEXT DEFAULT 'OPEN',
      admin_reply TEXT,
      admin_replied_at TEXT,
      admin_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      course_title TEXT,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT,
      total_points INTEGER DEFAULT 100,
      instructor_id TEXT,
      instructor_name TEXT,
      status TEXT DEFAULT 'PENDING',
      attachments_json TEXT,
      submissions_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      course_title TEXT,
      title TEXT NOT NULL,
      time_limit_minutes INTEGER DEFAULT 15,
      type TEXT,
      difficulty TEXT,
      instructor_id TEXT,
      instructor_name TEXT,
      instructor_avatar TEXT,
      total_points INTEGER DEFAULT 100,
      tags_json TEXT,
      description TEXT,
      questions_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      weak_topics_json TEXT,
      suggested_revision_json TEXT,
      completed_at TEXT NOT NULL
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      certificate_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_title TEXT NOT NULL,
      issue_hash TEXT,
      issue_date TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      score_percent INTEGER DEFAULT 100,
      skills_verified_json TEXT,
      skills_earned_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS discussions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      tags_json TEXT,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      author_role TEXT,
      upvotes INTEGER DEFAULT 0,
      replies_count INTEGER DEFAULT 0,
      is_resolved INTEGER DEFAULT 0,
      replies_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      members_json TEXT,
      milestones_json TEXT,
      repo_url TEXT,
      demo_url TEXT,
      created_at TEXT NOT NULL
    );
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS learntwin_profiles (
      student_id TEXT PRIMARY KEY,
      student_name TEXT,
      profile_json TEXT NOT NULL,
      last_updated TEXT NOT NULL
    );
  `);

  saveSqliteDb();
  return dbInstance;
}

export function saveSqliteDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error("Failed to persist SQLite database to disk:", err);
  }
}

// Uploads CRUD in SQLite
export interface SqliteUploadRecord {
  id: string;
  course_id?: string | null;
  title: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  resource_type: "video" | "pdf" | "presentation" | "code" | "image" | "file" | "other";
  created_at: string;
}

export async function recordUpload(record: SqliteUploadRecord): Promise<SqliteUploadRecord> {
  const db = await getSqliteDb();
  db.run(
    `INSERT INTO uploads (id, course_id, title, file_name, file_path, mime_type, file_size, resource_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      record.id,
      record.course_id || null,
      record.title,
      record.file_name,
      record.file_path,
      record.mime_type,
      record.file_size,
      record.resource_type,
      record.created_at
    ]
  );
  saveSqliteDb();
  return record;
}

export async function getUploadsByCourse(courseId: string): Promise<SqliteUploadRecord[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM uploads WHERE course_id = ? ORDER BY created_at DESC;");
  stmt.bind([courseId]);
  const results: SqliteUploadRecord[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push(row);
  }
  stmt.free();
  return results;
}

export async function getAllUploads(): Promise<SqliteUploadRecord[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM uploads ORDER BY created_at DESC;");
  const results: SqliteUploadRecord[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push(row);
  }
  stmt.free();
  return results;
}

export async function deleteUpload(id: string): Promise<boolean> {
  const db = await getSqliteDb();
  
  // Find file path to optionally remove from disk
  const stmt = db.prepare("SELECT file_path FROM uploads WHERE id = ?;");
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    if (row.file_path && fs.existsSync(row.file_path)) {
      try {
        fs.unlinkSync(row.file_path);
      } catch (e) {
        console.warn("Could not delete physical upload file:", e);
      }
    }
  }
  stmt.free();

  db.run("DELETE FROM uploads WHERE id = ?;", [id]);
  saveSqliteDb();
  return true;
}

// Course SQLite Operations
export async function saveCourseToSqlite(course: any): Promise<void> {
  const db = await getSqliteDb();
  const existingStmt = db.prepare("SELECT id FROM courses WHERE id = ?;");
  existingStmt.bind([course.id]);
  const exists = existingStmt.step();
  existingStmt.free();

  if (exists) {
    db.run(
      `UPDATE courses SET 
        title = ?, description = ?, category = ?, level = ?, instructor_id = ?, 
        instructor_name = ?, instructor_avatar = ?, thumbnail = ?, duration = ?, 
        enrolled_count = ?, rating = ?, lessons_json = ?, resources_json = ?, skills_json = ?
       WHERE id = ?;`,
      [
        course.title,
        course.description || "",
        course.category || "General",
        course.level || "Beginner",
        course.instructorId || "",
        course.instructorName || "Instructor",
        course.instructorAvatar || "",
        course.thumbnail || "",
        course.duration || "4 Hours",
        course.enrolledCount || 0,
        course.rating || 5.0,
        JSON.stringify(course.lessons || []),
        JSON.stringify(course.resources || []),
        JSON.stringify(course.skillsTaught || []),
        course.id
      ]
    );
  } else {
    db.run(
      `INSERT INTO courses (
        id, title, description, category, level, instructor_id, instructor_name, 
        instructor_avatar, thumbnail, duration, enrolled_count, rating, 
        lessons_json, resources_json, skills_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        course.id,
        course.title,
        course.description || "",
        course.category || "General",
        course.level || "Beginner",
        course.instructorId || "",
        course.instructorName || "Instructor",
        course.instructorAvatar || "",
        course.thumbnail || "",
        course.duration || "4 Hours",
        course.enrolledCount || 0,
        course.rating || 5.0,
        JSON.stringify(course.lessons || []),
        JSON.stringify(course.resources || []),
        JSON.stringify(course.skillsTaught || []),
        new Date().toISOString()
      ]
    );
  }

  // Also associate any embedded uploads with course_id in SQLite
  if (Array.isArray(course.resources)) {
    for (const res of course.resources) {
      if (res.uploadId) {
        db.run("UPDATE uploads SET course_id = ? WHERE id = ?;", [course.id, res.uploadId]);
      }
    }
  }

  saveSqliteDb();
}

export async function deleteCourseFromSqlite(courseId: string): Promise<boolean> {
  const db = await getSqliteDb();

  // Find and remove associated upload files
  const stmt = db.prepare("SELECT id, file_path FROM uploads WHERE course_id = ?;");
  stmt.bind([courseId]);
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    if (row.file_path && fs.existsSync(row.file_path)) {
      try {
        fs.unlinkSync(row.file_path);
      } catch (e) {
        console.warn("Failed to delete course file on disk:", e);
      }
    }
  }
  stmt.free();

  db.run("DELETE FROM uploads WHERE course_id = ?;", [courseId]);
  db.run("DELETE FROM courses WHERE id = ?;", [courseId]);
  saveSqliteDb();
  return true;
}

export async function getCoursesFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM courses ORDER BY created_at DESC;");
  const courses: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    courses.push({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      level: row.level,
      instructorId: row.instructor_id,
      instructorName: row.instructor_name,
      instructorAvatar: row.instructor_avatar,
      thumbnail: row.thumbnail,
      duration: row.duration,
      enrolledCount: row.enrolled_count,
      rating: row.rating,
      lessons: row.lessons_json ? JSON.parse(row.lessons_json) : [],
      resources: row.resources_json ? JSON.parse(row.resources_json) : [],
      skillsTaught: row.skills_json ? JSON.parse(row.skills_json) : []
    });
  }
  stmt.free();
  return courses;
}

// User Accounts CRUD in SQLite
export async function saveUserToSqlite(user: any): Promise<void> {
  const db = await getSqliteDb();
  const existingStmt = db.prepare("SELECT id FROM users WHERE id = ? OR email = ?;");
  existingStmt.bind([user.id, user.email]);
  const exists = existingStmt.step();
  existingStmt.free();

  const enrolledJson = JSON.stringify(user.enrolledCourseIds || []);
  const goalsJson = JSON.stringify(user.goals || []);
  const isApproved = user.approved === false ? 0 : 1;
  const officialId = user.officialId || user.id || null;

  if (exists) {
    db.run(
      `UPDATE users SET 
        name = ?, role = ?, department = ?, title = ?, 
        avatar = ?, official_id = ?, approved = ?, xp = ?, enrolled_courses_json = ?, goals_json = ? 
      WHERE id = ? OR email = ?;`,
      [
        user.name,
        user.role,
        user.department || null,
        user.title || null,
        user.avatar || null,
        officialId,
        isApproved,
        user.xp || 0,
        enrolledJson,
        goalsJson,
        user.id,
        user.email
      ]
    );
  } else {
    db.run(
      `INSERT INTO users (
        id, email, name, role, department, title, avatar, official_id,
        approved, xp, enrolled_courses_json, goals_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        user.id,
        user.email,
        user.name,
        user.role,
        user.department || null,
        user.title || null,
        user.avatar || null,
        officialId,
        isApproved,
        user.xp || 0,
        enrolledJson,
        goalsJson,
        new Date().toISOString()
      ]
    );
  }
  saveSqliteDb();
}

export async function deleteUserFromSqlite(userId: string): Promise<boolean> {
  const db = await getSqliteDb();
  db.run("DELETE FROM users WHERE id = ?;", [userId]);
  saveSqliteDb();
  return true;
}

export async function getUsersFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM users ORDER BY created_at ASC;");
  const userList: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    userList.push({
      id: row.id,
      officialId: row.official_id || row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      department: row.department,
      title: row.title,
      avatar: row.avatar,
      approved: row.approved === 1,
      xp: row.xp || 0,
      enrolledCourseIds: row.enrolled_courses_json ? JSON.parse(row.enrolled_courses_json) : [],
      goals: row.goals_json ? JSON.parse(row.goals_json) : []
    });
  }
  stmt.free();
  return userList;
}

// Complaints / Feedback CRUD in SQLite
export async function saveComplaintToSqlite(complaint: any): Promise<void> {
  const db = await getSqliteDb();
  const existingStmt = db.prepare("SELECT id FROM complaints WHERE id = ?;");
  existingStmt.bind([complaint.id]);
  const exists = existingStmt.step();
  existingStmt.free();

  const now = new Date().toISOString();

  if (exists) {
    db.run(
      `UPDATE complaints SET 
        student_id = ?, student_official_id = ?, student_name = ?, student_email = ?, student_avatar = ?, 
        course_id = ?, course_title = ?, category = ?, priority = ?, rating = ?, 
        issue = ?, status = ?, admin_reply = ?, admin_replied_at = ?, admin_name = ?, updated_at = ?
       WHERE id = ?;`,
      [
        complaint.studentId || null,
        complaint.studentOfficialId || null,
        complaint.studentName,
        complaint.studentEmail || null,
        complaint.studentAvatar || null,
        complaint.courseId || null,
        complaint.courseTitle || null,
        complaint.category || "General Feedback",
        complaint.priority || "Medium",
        complaint.rating !== undefined ? complaint.rating : 5,
        complaint.issue,
        complaint.status || "OPEN",
        complaint.adminReply || null,
        complaint.adminRepliedAt || null,
        complaint.adminName || null,
        now,
        complaint.id
      ]
    );
  } else {
    db.run(
      `INSERT INTO complaints (
        id, student_id, student_official_id, student_name, student_email, student_avatar,
        course_id, course_title, category, priority, rating, issue, status,
        admin_reply, admin_replied_at, admin_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        complaint.id,
        complaint.studentId || null,
        complaint.studentOfficialId || null,
        complaint.studentName,
        complaint.studentEmail || null,
        complaint.studentAvatar || null,
        complaint.courseId || null,
        complaint.courseTitle || null,
        complaint.category || "General Feedback",
        complaint.priority || "Medium",
        complaint.rating !== undefined ? complaint.rating : 5,
        complaint.issue,
        complaint.status || "OPEN",
        complaint.adminReply || null,
        complaint.adminRepliedAt || null,
        complaint.adminName || null,
        complaint.createdAt || now,
        now
      ]
    );
  }
  saveSqliteDb();
}

export async function getComplaintsFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM complaints ORDER BY created_at DESC;");
  const complaintsList: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    complaintsList.push({
      id: row.id,
      studentId: row.student_id,
      studentOfficialId: row.student_official_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      studentAvatar: row.student_avatar,
      courseId: row.course_id,
      courseTitle: row.course_title,
      category: row.category || "General Feedback",
      priority: row.priority || "Medium",
      rating: row.rating !== undefined ? row.rating : 5,
      issue: row.issue,
      status: row.status || "OPEN",
      adminReply: row.admin_reply,
      adminRepliedAt: row.admin_replied_at,
      adminName: row.admin_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
  stmt.free();
  return complaintsList;
}

export async function updateComplaintInSqlite(id: string, updates: Partial<any>): Promise<boolean> {
  const db = await getSqliteDb();
  const existingStmt = db.prepare("SELECT * FROM complaints WHERE id = ?;");
  existingStmt.bind([id]);
  if (!existingStmt.step()) {
    existingStmt.free();
    return false;
  }
  const existing = existingStmt.getAsObject() as any;
  existingStmt.free();

  const now = new Date().toISOString();
  const updatedStatus = updates.status !== undefined ? updates.status : existing.status;
  const updatedReply = updates.adminReply !== undefined ? updates.adminReply : existing.admin_reply;
  const updatedAdminName = updates.adminName !== undefined ? updates.adminName : existing.admin_name;
  const updatedRepliedAt = updates.adminReply ? now : existing.admin_replied_at;

  db.run(
    `UPDATE complaints SET 
      status = ?, admin_reply = ?, admin_replied_at = ?, admin_name = ?, updated_at = ?
     WHERE id = ?;`,
    [updatedStatus, updatedReply, updatedRepliedAt, updatedAdminName, now, id]
  );
  saveSqliteDb();
  return true;
}

export async function deleteComplaintFromSqlite(id: string): Promise<boolean> {
  const db = await getSqliteDb();
  db.run("DELETE FROM complaints WHERE id = ?;", [id]);
  saveSqliteDb();
  return true;
}

// ==========================================
// ASSIGNMENTS SQLITE PERSISTENCE
// ==========================================
export async function saveAssignmentToSqlite(assignment: any): Promise<void> {
  const db = await getSqliteDb();
  const existingStmt = db.prepare("SELECT id FROM assignments WHERE id = ?;");
  existingStmt.bind([assignment.id]);
  const exists = existingStmt.step();
  existingStmt.free();

  const attachmentsJson = JSON.stringify(assignment.attachments || []);
  const submissionsJson = JSON.stringify(assignment.submissions || []);

  if (exists) {
    db.run(
      `UPDATE assignments SET
        course_id = ?, course_title = ?, title = ?, description = ?, deadline = ?,
        total_points = ?, instructor_id = ?, instructor_name = ?, status = ?,
        attachments_json = ?, submissions_json = ?
       WHERE id = ?;`,
      [
        assignment.courseId || null,
        assignment.courseTitle || null,
        assignment.title,
        assignment.description || "",
        assignment.deadline || "",
        assignment.totalPoints || 100,
        assignment.instructorId || null,
        assignment.instructorName || null,
        assignment.status || "PENDING",
        attachmentsJson,
        submissionsJson,
        assignment.id
      ]
    );
  } else {
    db.run(
      `INSERT INTO assignments (
        id, course_id, course_title, title, description, deadline,
        total_points, instructor_id, instructor_name, status,
        attachments_json, submissions_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        assignment.id,
        assignment.courseId || null,
        assignment.courseTitle || null,
        assignment.title,
        assignment.description || "",
        assignment.deadline || "",
        assignment.totalPoints || 100,
        assignment.instructorId || null,
        assignment.instructorName || null,
        assignment.status || "PENDING",
        attachmentsJson,
        submissionsJson,
        assignment.createdAt || new Date().toISOString()
      ]
    );
  }
  saveSqliteDb();
}

export async function getAssignmentsFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM assignments ORDER BY created_at DESC;");
  const list: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    list.push({
      id: row.id,
      courseId: row.course_id,
      courseTitle: row.course_title,
      title: row.title,
      description: row.description,
      deadline: row.deadline,
      totalPoints: row.total_points,
      instructorId: row.instructor_id,
      instructorName: row.instructor_name,
      status: row.status,
      attachments: row.attachments_json ? JSON.parse(row.attachments_json) : [],
      submissions: row.submissions_json ? JSON.parse(row.submissions_json) : [],
      submissionsCount: row.submissions_json ? JSON.parse(row.submissions_json).length : 0,
      createdAt: row.created_at
    });
  }
  stmt.free();
  return list;
}

export async function deleteAssignmentFromSqlite(id: string): Promise<boolean> {
  const db = await getSqliteDb();
  db.run("DELETE FROM assignments WHERE id = ?;", [id]);
  saveSqliteDb();
  return true;
}

// ==========================================
// QUIZZES SQLITE PERSISTENCE
// ==========================================
export async function saveQuizToSqlite(quiz: any): Promise<void> {
  const db = await getSqliteDb();
  const existingStmt = db.prepare("SELECT id FROM quizzes WHERE id = ?;");
  existingStmt.bind([quiz.id]);
  const exists = existingStmt.step();
  existingStmt.free();

  const tagsJson = JSON.stringify(quiz.tags || []);
  const questionsJson = JSON.stringify(quiz.questions || []);

  if (exists) {
    db.run(
      `UPDATE quizzes SET
        course_id = ?, course_title = ?, title = ?, time_limit_minutes = ?,
        type = ?, difficulty = ?, instructor_id = ?, instructor_name = ?,
        instructor_avatar = ?, total_points = ?, tags_json = ?,
        description = ?, questions_json = ?
       WHERE id = ?;`,
      [
        quiz.courseId || null,
        quiz.courseTitle || null,
        quiz.title,
        quiz.timeLimitMinutes || 15,
        quiz.type || "teacher_uploaded",
        quiz.difficulty || "Intermediate",
        quiz.instructorId || null,
        quiz.instructorName || null,
        quiz.instructorAvatar || null,
        quiz.totalPoints || 100,
        tagsJson,
        quiz.description || "",
        questionsJson,
        quiz.id
      ]
    );
  } else {
    db.run(
      `INSERT INTO quizzes (
        id, course_id, course_title, title, time_limit_minutes,
        type, difficulty, instructor_id, instructor_name,
        instructor_avatar, total_points, tags_json,
        description, questions_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        quiz.id,
        quiz.courseId || null,
        quiz.courseTitle || null,
        quiz.title,
        quiz.timeLimitMinutes || 15,
        quiz.type || "teacher_uploaded",
        quiz.difficulty || "Intermediate",
        quiz.instructorId || null,
        quiz.instructorName || null,
        quiz.instructorAvatar || null,
        quiz.totalPoints || 100,
        tagsJson,
        quiz.description || "",
        questionsJson,
        quiz.createdAt || new Date().toISOString()
      ]
    );
  }
  saveSqliteDb();
}

export async function getQuizzesFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM quizzes ORDER BY created_at DESC;");
  const list: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    list.push({
      id: row.id,
      courseId: row.course_id,
      courseTitle: row.course_title,
      title: row.title,
      timeLimitMinutes: row.time_limit_minutes,
      type: row.type,
      difficulty: row.difficulty,
      instructorId: row.instructor_id,
      instructorName: row.instructor_name,
      instructorAvatar: row.instructor_avatar,
      totalPoints: row.total_points,
      tags: row.tags_json ? JSON.parse(row.tags_json) : [],
      description: row.description,
      questions: row.questions_json ? JSON.parse(row.questions_json) : [],
      createdAt: row.created_at
    });
  }
  stmt.free();
  return list;
}

export async function deleteQuizFromSqlite(id: string): Promise<boolean> {
  const db = await getSqliteDb();
  db.run("DELETE FROM quizzes WHERE id = ?;", [id]);
  saveSqliteDb();
  return true;
}

export async function saveQuizAttemptToSqlite(attempt: any): Promise<void> {
  const db = await getSqliteDb();
  db.run(
    `INSERT INTO quiz_attempts (
      id, quiz_id, student_id, student_name, score, max_score,
      percentage, weak_topics_json, suggested_revision_json, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      attempt.id,
      attempt.quizId,
      attempt.studentId,
      attempt.studentName,
      attempt.score,
      attempt.maxScore,
      attempt.percentage,
      JSON.stringify(attempt.weakTopics || []),
      JSON.stringify(attempt.suggestedRevision || []),
      attempt.completedAt || new Date().toISOString()
    ]
  );
  saveSqliteDb();
}

export async function getQuizAttemptsFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM quiz_attempts ORDER BY completed_at DESC;");
  const list: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    list.push({
      id: row.id,
      quizId: row.quiz_id,
      studentId: row.student_id,
      studentName: row.student_name,
      score: row.score,
      maxScore: row.max_score,
      percentage: row.percentage,
      weakTopics: row.weak_topics_json ? JSON.parse(row.weak_topics_json) : [],
      suggestedRevision: row.suggested_revision_json ? JSON.parse(row.suggested_revision_json) : [],
      completedAt: row.completed_at
    });
  }
  stmt.free();
  return list;
}

// ==========================================
// CERTIFICATES SQLITE PERSISTENCE
// ==========================================
export async function saveCertificateToSqlite(cert: any): Promise<void> {
  const db = await getSqliteDb();
  db.run(
    `INSERT OR REPLACE INTO certificates (
      id, certificate_id, student_id, student_name, course_id, course_title,
      issue_hash, issue_date, teacher_name, score_percent,
      skills_verified_json, skills_earned_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      cert.id,
      cert.certificateId || cert.id,
      cert.studentId,
      cert.studentName,
      cert.courseId,
      cert.courseTitle,
      cert.issueHash || null,
      cert.issueDate || new Date().toISOString().split("T")[0],
      cert.teacherName || "Instructor",
      cert.scorePercent || 100,
      JSON.stringify(cert.skillsVerified || []),
      JSON.stringify(cert.skillsEarned || []),
      cert.createdAt || new Date().toISOString()
    ]
  );
  saveSqliteDb();
}

export async function getCertificatesFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM certificates ORDER BY created_at DESC;");
  const list: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    list.push({
      id: row.id,
      certificateId: row.certificate_id,
      studentId: row.student_id,
      studentName: row.student_name,
      courseId: row.course_id,
      courseTitle: row.course_title,
      issueHash: row.issue_hash,
      issueDate: row.issue_date,
      teacherName: row.teacher_name,
      scorePercent: row.score_percent,
      skillsVerified: row.skills_verified_json ? JSON.parse(row.skills_verified_json) : [],
      skillsEarned: row.skills_earned_json ? JSON.parse(row.skills_earned_json) : [],
      createdAt: row.created_at
    });
  }
  stmt.free();
  return list;
}

// ==========================================
// DISCUSSIONS & PROJECTS SQLITE PERSISTENCE
// ==========================================
export async function saveDiscussionToSqlite(disc: any): Promise<void> {
  const db = await getSqliteDb();
  db.run(
    `INSERT OR REPLACE INTO discussions (
      id, title, content, category, tags_json, author_name,
      author_avatar, author_role, upvotes, replies_count,
      is_resolved, replies_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      disc.id,
      disc.title,
      disc.content,
      disc.category || "General",
      JSON.stringify(disc.tags || []),
      disc.authorName || disc.author || "User",
      disc.authorAvatar || null,
      disc.authorRole || "STUDENT",
      disc.upvotes || 0,
      disc.replies?.length || disc.repliesCount || 0,
      disc.isResolved ? 1 : 0,
      JSON.stringify(disc.replies || []),
      disc.createdAt || new Date().toISOString()
    ]
  );
  saveSqliteDb();
}

export async function getDiscussionsFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM discussions ORDER BY created_at DESC;");
  const list: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    list.push({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: row.tags_json ? JSON.parse(row.tags_json) : [],
      author: row.author_name,
      authorName: row.author_name,
      authorAvatar: row.author_avatar,
      authorRole: row.author_role,
      upvotes: row.upvotes,
      repliesCount: row.replies_count,
      isResolved: Boolean(row.is_resolved),
      replies: row.replies_json ? JSON.parse(row.replies_json) : [],
      createdAt: row.created_at
    });
  }
  stmt.free();
  return list;
}

export async function saveProjectToSqlite(proj: any): Promise<void> {
  const db = await getSqliteDb();
  db.run(
    `INSERT OR REPLACE INTO projects (
      id, title, description, category, members_json,
      milestones_json, repo_url, demo_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      proj.id,
      proj.title,
      proj.description || "",
      proj.category || "Web Development",
      JSON.stringify(proj.currentMembers || proj.members || []),
      JSON.stringify(proj.milestones || []),
      proj.repoUrl || "",
      proj.demoUrl || "",
      proj.createdAt || new Date().toISOString()
    ]
  );
  saveSqliteDb();
}

export async function getProjectsFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM projects ORDER BY created_at DESC;");
  const list: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    list.push({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      currentMembers: row.members_json ? JSON.parse(row.members_json) : [],
      members: row.members_json ? JSON.parse(row.members_json) : [],
      milestones: row.milestones_json ? JSON.parse(row.milestones_json) : [],
      repoUrl: row.repo_url,
      demoUrl: row.demo_url,
      createdAt: row.created_at
    });
  }
  stmt.free();
  return list;
}

// ==========================================
// LEARNTWIN COGNITIVE TWIN PERSISTENCE
// ==========================================
export async function saveLearnTwinToSqlite(studentId: string, studentName: string, profile: any): Promise<void> {
  const db = await getSqliteDb();
  db.run(
    `INSERT OR REPLACE INTO learntwin_profiles (
      student_id, student_name, profile_json, last_updated
    ) VALUES (?, ?, ?, ?);`,
    [
      studentId,
      studentName || "Student",
      JSON.stringify(profile),
      new Date().toISOString()
    ]
  );
  saveSqliteDb();
}

export async function getLearnTwinFromSqlite(studentId: string): Promise<any | null> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM learntwin_profiles WHERE student_id = ?;");
  stmt.bind([studentId]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as any;
    stmt.free();
    return row.profile_json ? JSON.parse(row.profile_json) : null;
  }
  stmt.free();
  return null;
}

export async function getAllLearnTwinsFromSqlite(): Promise<any[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare("SELECT * FROM learntwin_profiles ORDER BY last_updated DESC;");
  const list: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    list.push({
      studentId: row.student_id,
      studentName: row.student_name,
      profile: row.profile_json ? JSON.parse(row.profile_json) : null,
      lastUpdated: row.last_updated
    });
  }
  stmt.free();
  return list;
}



