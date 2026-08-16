import React, { useState, useEffect, useMemo } from "react";
import { 
  User, 
  Role, 
  Course, 
  LearningTwinProfile, 
  PredictedRisk, 
  ConceptMasteryNode,
  RecommendedIntervention,
  MistakeDnaEntry
} from "../types";
import { 
  getStoredLearningTwin, 
  evolveLearningTwinProfile 
} from "../lib/api";
import { EduNexLogoMark } from "./EduNexLogo";
import { 
  Sparkles, 
  Brain, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  Layers, 
  Compass, 
  Play, 
  Target, 
  ChevronRight, 
  Zap, 
  Clock, 
  BarChart3,
  Users,
  TrendingDown,
  TrendingUp,
  Send,
  AlertOctagon,
  Search,
  BookOpen,
  GraduationCap
} from "lucide-react";

interface LearnTwinViewProps {
  currentUser: User | null;
  userRole: Role;
  users?: User[];
  courses?: Course[];
  initialSubTab?: string;
  onOpenAiAssistant: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const LearnTwinView: React.FC<LearnTwinViewProps> = ({
  currentUser,
  userRole,
  users = [],
  courses = [],
  initialSubTab,
  onOpenAiAssistant,
  onNavigateTab
}) => {
  const roleUpper = String(userRole || currentUser?.role).toUpperCase();
  const isTeacherOrAdmin = roleUpper === "TEACHER" || roleUpper === "ADMIN";

  // List of students for Teacher/Admin inspection
  const studentUsers = useMemo(() => {
    return users.filter(u => String(u.role).toUpperCase() === "STUDENT");
  }, [users]);

  const defaultStudentId = currentUser && roleUpper === "STUDENT" 
    ? currentUser.id 
    : (studentUsers[0]?.id || currentUser?.id || "student-1");

  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultStudentId);
  const [twinProfile, setTwinProfile] = useState<LearningTwinProfile>(() => {
    const studentObj = users.find(u => u.id === selectedStudentId) || currentUser;
    return getStoredLearningTwin(selectedStudentId, studentObj?.name, studentObj?.avatar);
  });

  // Active View Tab:
  // For Student: 'twin' | 'failure_simulator' | 'interventions'
  // For Teacher: 'teacher_overview' | 'teacher_weak_skills' | 'teacher_failure_probability' | 'teacher_cohort_matrix'
  const [activeSubTab, setActiveSubTab] = useState<string>(
    initialSubTab || (isTeacherOrAdmin ? 'teacher_weak_skills' : 'twin')
  );

  // Sync initialSubTab if parent prop changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Teacher Filter & Search state
  const [weakSkillFilter, setWeakSkillFilter] = useState<'all' | 'critical' | 'transfer_gap' | 'frequent_mistakes'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dispatchedInterventions, setDispatchedInterventions] = useState<{ [key: string]: string }>({});

  // Student Live Simulator State
  const [activeSimRisk, setActiveSimRisk] = useState<PredictedRisk | null>(null);
  const [simSelectedOption, setSimSelectedOption] = useState<number | null>(null);
  const [simSubmitted, setSimSubmitted] = useState<boolean>(false);
  const [simFeedback, setSimFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Sync profile when student selection changes or storage events occur
  useEffect(() => {
    const refreshProfile = () => {
      const studentObj = users.find(u => u.id === selectedStudentId) || currentUser;
      const profile = getStoredLearningTwin(selectedStudentId, studentObj?.name, studentObj?.avatar);
      setTwinProfile(profile);
      if (profile.predicted_risks && profile.predicted_risks.length > 0) {
        setActiveSimRisk(prev => {
          if (!prev) return profile.predicted_risks[0];
          const matched = profile.predicted_risks.find(r => r.concept === prev.concept || r.id === prev.id);
          return matched || profile.predicted_risks[0];
        });
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.includes("learntwin") || e.key.includes("edunex")) {
        refreshProfile();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", refreshProfile);

    refreshProfile();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", refreshProfile);
    };
  }, [selectedStudentId, users, currentUser]);

  // Compute Cohort Statistics for Teacher
  const cohortAnalytics = useMemo(() => {
    if (!isTeacherOrAdmin || studentUsers.length === 0) return null;

    const studentProfiles = studentUsers.map(s => {
      const p = getStoredLearningTwin(s.id, s.name, s.avatar);
      const concepts = Object.values(p.concept_mastery);
      const avgMastery = concepts.length > 0
        ? Math.round(concepts.reduce((acc, c) => acc + (typeof c === "number" ? c : c.masteryScore), 0) / concepts.length)
        : 0;
      
      const maxRisk = p.predicted_risks.length > 0
        ? Math.max(...p.predicted_risks.map(r => r.riskScore))
        : 0;

      // Find lowest concept
      let lowestConcept = "None";
      let lowestScore = 100;
      concepts.forEach(c => {
        const score = typeof c === "number" ? c : c.masteryScore;
        const name = typeof c === "number" ? "General" : c.concept;
        if (score < lowestScore) {
          lowestScore = score;
          lowestConcept = name;
        }
      });

      return {
        student: s,
        profile: p,
        assessedCount: concepts.length,
        avgMastery,
        maxRisk,
        lowestConcept: concepts.length > 0 ? `${lowestConcept} (${lowestScore}%)` : "Unassessed",
        hasHighRisk: maxRisk >= 60 || (concepts.length > 0 && avgMastery < 60)
      };
    });

    const highRiskStudents = studentProfiles.filter(sp => sp.hasHighRisk);
    const totalAssessed = studentProfiles.filter(sp => sp.assessedCount > 0).length;

    // Aggregate Class-wide Weak Topics
    const conceptFailureFrequencies: { [concept: string]: { count: number; totalScore: number; occurrences: number } } = {};
    studentProfiles.forEach(sp => {
      Object.entries(sp.profile.concept_mastery).forEach(([cName, rawNode]) => {
        const score = typeof rawNode === "number" ? rawNode : rawNode.masteryScore;
        if (!conceptFailureFrequencies[cName]) {
          conceptFailureFrequencies[cName] = { count: 0, totalScore: 0, occurrences: 0 };
        }
        conceptFailureFrequencies[cName].occurrences += 1;
        conceptFailureFrequencies[cName].totalScore += score;
        if (score < 70) {
          conceptFailureFrequencies[cName].count += 1;
        }
      });
    });

    const classWeakTopics = Object.entries(conceptFailureFrequencies)
      .map(([concept, data]) => ({
        concept,
        atRiskStudentCount: data.count,
        avgClassScore: Math.round(data.totalScore / data.occurrences),
        totalTested: data.occurrences,
        riskPercentage: Math.round((data.count / data.occurrences) * 100)
      }))
      .sort((a, b) => b.atRiskStudentCount - a.atRiskStudentCount);

    return {
      studentProfiles,
      totalStudents: studentUsers.length,
      totalAssessed,
      highRiskCount: highRiskStudents.length,
      classWeakTopics
    };
  }, [isTeacherOrAdmin, studentUsers]);

  // Derived Weak Skills for Selected Student
  const studentWeakSkills = useMemo(() => {
    const rawNodes = Object.entries(twinProfile.concept_mastery);
    return rawNodes
      .map(([concept, rawNode]) => {
        const node: ConceptMasteryNode = typeof rawNode === "number"
          ? {
              concept,
              masteryScore: rawNode,
              confidenceLevel: 75,
              evidenceCount: 1,
              retentionStability: 80,
              transferAbility: 60,
              lastTested: "Recently",
              predictedDecayDays: 14
            }
          : rawNode;

        const relatedMistakes = twinProfile.mistake_patterns.filter(m => 
          m.concept.toLowerCase().includes(concept.toLowerCase()) || 
          concept.toLowerCase().includes(m.concept.toLowerCase())
        );

        const predictedRisk = twinProfile.predicted_risks.find(r => 
          r.concept.toLowerCase().includes(concept.toLowerCase()) ||
          concept.toLowerCase().includes(r.concept.toLowerCase())
        );

        // Failure probability calculation
        const failureProb = predictedRisk 
          ? predictedRisk.riskScore 
          : Math.max(15, Math.min(95, 100 - node.masteryScore + (node.transferAbility < 50 ? 15 : 0)));

        return {
          concept,
          node,
          relatedMistakes,
          predictedRisk,
          failureProbability: failureProb,
          isCritical: node.masteryScore < 60 || failureProb >= 65,
          isTransferGap: node.transferAbility < 60 && node.masteryScore >= 60,
          hasFrequentMistakes: relatedMistakes.length > 0
        };
      })
      .filter(item => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return item.concept.toLowerCase().includes(q) || (item.predictedRisk?.reason || '').toLowerCase().includes(q);
        }
        return true;
      })
      .filter(item => {
        if (weakSkillFilter === 'critical') return item.isCritical;
        if (weakSkillFilter === 'transfer_gap') return item.isTransferGap;
        if (weakSkillFilter === 'frequent_mistakes') return item.hasFrequentMistakes;
        return true;
      })
      .sort((a, b) => b.failureProbability - a.failureProbability);
  }, [twinProfile, searchQuery, weakSkillFilter]);

  // Handle Teacher Dispatching Remedial Action
  const handleDispatchRemediation = (concept: string, actionType: string) => {
    setDispatchedInterventions(prev => ({
      ...prev,
      [concept]: actionType
    }));
  };

  // Handle Student Live Simulation submission
  const handleExecuteSimulation = (risk: PredictedRisk, optionIdx: number) => {
    if (!risk.simulatorScenario) return;
    setSimSelectedOption(optionIdx);
    setSimSubmitted(true);
    const isCorrect = optionIdx === risk.simulatorScenario.correctChoice;

    if (isCorrect) {
      setSimFeedback({
        isCorrect: true,
        message: `✓ Flawless Transfer! You successfully recognized that ${risk.concept} was required without explicit keyword hints. ${risk.simulatorScenario.explanation}`
      });

      const updated = evolveLearningTwinProfile(selectedStudentId, {
        eventType: "completed_mission",
        concept: risk.concept,
        confidenceLevel: 92
      });
      setTwinProfile(updated);
    } else {
      setSimFeedback({
        isCorrect: false,
        message: `✗ Cognitive Gap Detected: The student AI twin identified difficulty transferring theoretical principles to dynamic edge-cases. ${risk.simulatorScenario.explanation}`
      });

      const updated = evolveLearningTwinProfile(selectedStudentId, {
        eventType: "made_error",
        concept: risk.concept,
        mistakeType: "Difficulty transferring knowledge",
        studentAnswer: risk.simulatorScenario.options[optionIdx],
        correctReasoning: risk.simulatorScenario.explanation,
        confidenceLevel: 45
      });
      setTwinProfile(updated);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Banner & Mode Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <EduNexLogoMark size={220} />
        </div>

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isTeacherOrAdmin ? "Teacher Diagnostic Intelligence Suite" : "AI Student Cognitive Learning Twin"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <span>{isTeacherOrAdmin ? "Student Diagnostic & Failure Probability Radar" : "LearnTwin™ Cognitive Engine"}</span>
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          </h1>

          <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
            {isTeacherOrAdmin
              ? "Empirical metacognitive analytics detecting students' hidden prerequisite deficits, knowledge transfer bottlenecks, and probabilistic failure triggers."
              : "Continuously evolving cognitive model tracking how you think, reason, retain concepts, and transfer knowledge to unfamiliar real-world architectures."}
          </p>
        </div>

        {/* Teacher/Admin Student Selector Switcher */}
        {isTeacherOrAdmin && (
          <div className="relative z-10 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 space-y-2 shrink-0 sm:min-w-[260px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 block flex items-center justify-between">
              <span>Inspect Student:</span>
              <span className="text-[10px] text-indigo-300 font-normal">{studentUsers.length} Enrolled</span>
            </span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-900 text-white font-bold text-xs p-2.5 rounded-xl border border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {studentUsers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.officialId || "ID-REG"})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-300 block truncate">
              Active Focus: <strong>{twinProfile.studentName}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {isTeacherOrAdmin ? (
          <>
            {/* TEACHER SUB-TABS */}
            <button
              onClick={() => setActiveSubTab('teacher_weak_skills')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSubTab === 'teacher_weak_skills'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <TrendingDown className="w-4 h-4 text-amber-200" />
              <span>Weak Skills & Deficits ({Object.keys(twinProfile.concept_mastery).length > 0 ? studentWeakSkills.filter(s => s.node.masteryScore < 70).length : 0})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('teacher_failure_probability')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSubTab === 'teacher_failure_probability'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-rose-200" />
              <span>Failure Probability & Risk Radar ({twinProfile.predicted_risks.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('teacher_cohort_matrix')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSubTab === 'teacher_cohort_matrix'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-300" />
              <span>Cohort Risk Matrix ({cohortAnalytics?.highRiskCount || 0} At Risk)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('twin')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSubTab === 'twin'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Student Metacognitive Twin</span>
            </button>
          </>
        ) : (
          <>
            {/* STUDENT SUB-TABS */}
            <button
              onClick={() => setActiveSubTab('twin')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSubTab === 'twin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Cognitive Profile Overview</span>
            </button>

            <button
              onClick={() => setActiveSubTab('failure_simulator')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSubTab === 'failure_simulator'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>Future Failure Simulator ({twinProfile.predicted_risks.length} Risks)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('interventions')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeSubTab === 'interventions'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Target className="w-4 h-4 text-emerald-500" />
              <span>Targeted Interventions ({twinProfile.recommended_interventions.length})</span>
            </button>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TEACHER VIEW: WEAK SKILLS & PREREQUISITE DEFICITS                          */}
      {/* ========================================================================= */}
      {isTeacherOrAdmin && activeSubTab === 'teacher_weak_skills' && (
        <div className="space-y-6">
          {Object.keys(twinProfile.concept_mastery).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <TrendingDown className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No Assessment Telemetry for {twinProfile.studentName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Weak skills and prerequisite knowledge gaps are derived dynamically from completed quizzes, code tasks, and graded assignments. Select another student or assign course assessments.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-500" /> Critical Weaknesses
                  </span>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {studentWeakSkills.filter(s => s.isCritical).length} Concepts
                  </div>
                  <p className="text-[11px] text-slate-500">Mastery score under 60% with high exam risk.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-500" /> Transfer Gaps
                  </span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {studentWeakSkills.filter(s => s.isTransferGap).length} Concepts
                  </div>
                  <p className="text-[11px] text-slate-500">Good syntax recall but fails unguided edge-cases.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-500" /> Recurring Mistakes
                  </span>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {twinProfile.mistake_patterns.length} Logged Patterns
                  </div>
                  <p className="text-[11px] text-slate-500">Classified cognitive error triggers across tests.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-500" /> Proficient Skills
                  </span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {studentWeakSkills.filter(s => s.node.masteryScore >= 70).length} Concepts
                  </div>
                  <p className="text-[11px] text-slate-500">Robust retention & strong transfer resilience.</p>
                </div>
              </div>

              {/* Filters & Search Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Vulnerabilities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'critical', 'transfer_gap', 'frequent_mistakes'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setWeakSkillFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          weakSkillFilter === f
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {f === 'all' && 'All Skills'}
                        {f === 'critical' && 'Critical (<60%)'}
                        {f === 'transfer_gap' && 'Transfer Gaps'}
                        {f === 'frequent_mistakes' && 'Mistake Patterns'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search concepts or risks..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
                  />
                </div>
              </div>

              {/* Detailed Skill Vulnerability Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentWeakSkills.map((item) => (
                  <div
                    key={item.concept}
                    className={`p-5 rounded-3xl border transition-all space-y-4 ${
                      item.isCritical
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                        : item.isTransferGap
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {item.concept}
                          </h3>
                          {item.isCritical && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              High Vulnerability
                            </span>
                          )}
                          {item.isTransferGap && !item.isCritical && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Transfer Deficit
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Evidence: {item.node.evidenceCount} verified responses • Memory Decay: {item.node.predictedDecayDays}d
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Failure Risk</span>
                        <span className={`text-base font-black ${
                          item.failureProbability >= 70 ? 'text-rose-600 dark:text-rose-400' :
                          item.failureProbability >= 45 ? 'text-amber-600 dark:text-amber-400' :
                          'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {item.failureProbability}%
                        </span>
                      </div>
                    </div>

                    {/* Dual Performance Metrics */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-500 text-[11px] mb-1">
                          <span>Concept Mastery:</span>
                          <strong className="text-slate-900 dark:text-white">{item.node.masteryScore}%</strong>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.node.masteryScore < 60 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                            style={{ width: `${item.node.masteryScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-500 text-[11px] mb-1">
                          <span>Transfer Ability:</span>
                          <strong className="text-slate-900 dark:text-white">{item.node.transferAbility}%</strong>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.node.transferAbility < 60 ? 'bg-amber-500' : 'bg-teal-500'}`}
                            style={{ width: `${item.node.transferAbility}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Prerequisite & Diagnostic Insights */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          {item.predictedRisk?.reason || 
                            (item.node.masteryScore < 60 
                              ? `Student demonstrates fundamental confusion in ${item.concept} syntax and execution models.`
                              : `Student understands theoretical rules but struggles when applying ${item.concept} to novel application logic.`)}
                        </span>
                      </div>

                      {/* Logged Mistake Pattern */}
                      {item.relatedMistakes.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 text-[11px] text-purple-900 dark:text-purple-200">
                          <span className="font-bold block">Dominant Cognitive Flaw: {item.relatedMistakes[0].mistakeType}</span>
                          <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-0.5">
                            "{item.relatedMistakes[0].studentAnswer}" vs Expected: "{item.relatedMistakes[0].correctReasoning}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Teacher Action Prescriber */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Teacher Remediation:</span>
                      
                      {dispatchedInterventions[item.concept] ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {dispatchedInterventions[item.concept]} Dispatched
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDispatchRemediation(item.concept, "Targeted Socratic Quiz")}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-all flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Send Remedial Quiz
                          </button>
                          <button
                            onClick={() => handleDispatchRemediation(item.concept, "1-on-1 Review Session")}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all"
                          >
                            Schedule 1-on-1
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEACHER VIEW: FAILURE PROBABILITY & RISK RADAR                             */}
      {/* ========================================================================= */}
      {isTeacherOrAdmin && activeSubTab === 'teacher_failure_probability' && (
        <div className="space-y-6">
          {twinProfile.predicted_risks.length === 0 && Object.keys(twinProfile.concept_mastery).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No Failure Risk Telemetry for {twinProfile.studentName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Real failure risk probabilities and edge-case failure triggers are calculated automatically as the student engages in quizzes, exercises, and assignments.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Probabilistic Failure Summary */}
              <div className="space-y-4">
                {/* Master Failure Index */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                      Exam Failure Risk Index
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Multivariate projection combining retention decay and transfer gaps.
                    </p>
                  </div>

                  {(() => {
                    const highestRisk = twinProfile.predicted_risks.length > 0
                      ? Math.max(...twinProfile.predicted_risks.map(r => r.riskScore))
                      : 25;
                    return (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Composite Risk Score</span>
                          <span className={`text-2xl font-black ${
                            highestRisk >= 70 ? 'text-rose-600 dark:text-rose-400' :
                            highestRisk >= 45 ? 'text-amber-600 dark:text-amber-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {highestRisk}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              highestRisk >= 70 ? 'bg-rose-500' : highestRisk >= 45 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${highestRisk}%` }}
                          />
                        </div>

                        <span className="text-[11px] text-slate-500 block">
                          Status: <strong className={highestRisk >= 70 ? 'text-rose-600 font-extrabold' : 'text-amber-600 font-bold'}>
                            {highestRisk >= 70 ? 'Immediate Intervention Recommended' : highestRisk >= 45 ? 'Moderate Vulnerability Detected' : 'Student on Track'}
                          </strong>
                        </span>
                      </div>
                    );
                  })()}

                  {/* Cognitive Risk Factors */}
                  <div className="space-y-2.5 text-xs">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Key Vulnerability Factors</h3>
                    
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <span className="text-slate-500">Guessing Tendency:</span>
                      <strong className={twinProfile.guessing_vs_reasoning.guessing_tendency > 30 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}>
                        {twinProfile.guessing_vs_reasoning.guessing_tendency}%
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <span className="text-slate-500">Reasoning Depth:</span>
                      <strong className={twinProfile.reasoning_score < 60 ? 'text-amber-500' : 'text-emerald-500'}>
                        {twinProfile.reasoning_score}/100
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <span className="text-slate-500">Response Latency:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {twinProfile.response_time_avg_sec}s avg
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 2 Columns: Detailed Failure Scenarios & Trigger Conditions */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        Predicted Failure Triggers & Edge Cases
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Simulated scenarios where {twinProfile.studentName} is statistically most likely to fail.
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {twinProfile.predicted_risks.length} Projected Scenarios
                    </span>
                  </div>

                  {twinProfile.predicted_risks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                      No critical failure scenarios currently projected. The student has demonstrated resilient concept transfer on all tested topics.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {twinProfile.predicted_risks.map((risk, idx) => (
                        <div
                          key={`${risk.id || 'risk'}-${idx}`}
                          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {risk.concept}
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  risk.riskScore >= 70 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                  {risk.riskScore}% Failure Probability
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                {risk.reason}
                              </p>
                            </div>

                            <span className="text-[11px] font-bold text-slate-400 shrink-0">
                              Mastery: {risk.currentMastery}%
                            </span>
                          </div>

                          {/* Failure Trigger Context */}
                          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-1 text-amber-900 dark:text-amber-200">
                            <span className="font-bold flex items-center gap-1.5 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Trigger Condition:
                            </span>
                            <p className="text-[11px] pl-5 leading-relaxed">{risk.contextTrigger}</p>
                          </div>

                          {/* Recommended Teacher Prescription */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                            <span className="text-slate-500">
                              Prescription: <strong>{risk.recommendedIntervention}</strong>
                            </span>

                            {dispatchedInterventions[risk.concept] ? (
                              <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Prescribed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDispatchRemediation(risk.concept, "Targeted Failure Intervention")}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Prescribe Remedial Intervention
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEACHER VIEW: COHORT RISK MATRIX                                           */}
      {/* ========================================================================= */}
      {isTeacherOrAdmin && activeSubTab === 'teacher_cohort_matrix' && cohortAnalytics && (
        <div className="space-y-6">
          {/* Cohort Level Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" /> Total Enrolled Students
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {cohortAnalytics.totalStudents} Students
              </div>
              <p className="text-[11px] text-slate-500">{cohortAnalytics.totalAssessed} active with telemetry data</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-500" /> High-Risk Students
              </span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {cohortAnalytics.highRiskCount} Students
              </div>
              <p className="text-[11px] text-slate-500">Require immediate instructional support</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-500" /> Class Bottleneck Topics
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {cohortAnalytics.classWeakTopics.length} Detected
              </div>
              <p className="text-[11px] text-slate-500">Concepts with high failure frequency across cohort</p>
            </div>
          </div>

          {/* Class-wide Weak Topics Table */}
          {cohortAnalytics.classWeakTopics.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-500" />
                Class-Wide Weak Concepts (Cohort Bottlenecks)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cohortAnalytics.classWeakTopics.map((topic) => (
                  <div
                    key={topic.concept}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{topic.concept}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {topic.riskPercentage}% Cohort Gap
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Avg Score: <strong>{topic.avgClassScore}%</strong></span>
                      <span>At Risk: <strong className="text-rose-600">{topic.atRiskStudentCount} students</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Risk Matrix Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Student Risk & Support Priority Matrix
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3 pl-2">Student</th>
                    <th className="pb-3">Assessment Status</th>
                    <th className="pb-3">Average Mastery</th>
                    <th className="pb-3">Failure Probability</th>
                    <th className="pb-3">Weakest Concept</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {cohortAnalytics.studentProfiles.map((sp) => (
                    <tr key={sp.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={sp.student.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                            alt={sp.student.name}
                            className="w-8 h-8 rounded-xl object-cover"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{sp.student.name}</span>
                            <span className="text-[10px] text-slate-400">{sp.student.officialId || "ID-REG"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sp.assessedCount > 0
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {sp.assessedCount > 0 ? `${sp.assessedCount} Concepts Assessed` : 'Awaiting Quizzes'}
                        </span>
                      </td>

                      <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                        {sp.assessedCount > 0 ? `${sp.avgMastery}%` : '—'}
                      </td>

                      <td className="py-3">
                        {sp.assessedCount > 0 ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            sp.maxRisk >= 65 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            sp.maxRisk >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {sp.maxRisk}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">
                        {sp.lowestConcept}
                      </td>

                      <td className="py-3 text-right pr-2">
                        <button
                          onClick={() => {
                            setSelectedStudentId(sp.student.id);
                            setActiveSubTab('teacher_weak_skills');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all"
                        >
                          Inspect Twin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHARED/STUDENT TAB: COGNITIVE PROFILE OVERVIEW                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'twin' && (
        <div className="space-y-6">
          {Object.keys(twinProfile.concept_mastery).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6 max-w-3xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Brain className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {roleUpper === "STUDENT" 
                    ? "Cognitive Twin Calibrating" 
                    : `No Assessment Telemetry for ${twinProfile.studentName}`}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                  {roleUpper === "STUDENT"
                    ? "EduNex AI Learning Twin only computes real cognitive telemetry, reasoning depth, and failure risk models after you engage with course lessons, interactive quizzes, or assignments."
                    : `${twinProfile.studentName} has not completed any quizzes or course assignments yet. The cognitive twin profile and failure risk projections will automatically populate once coursework is completed.`}
                </p>
              </div>

              {roleUpper === "STUDENT" && onNavigateTab && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto text-left">
                  <button
                    onClick={() => onNavigateTab("quizzes")}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 transition-all group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">Take a Quiz</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Complete a 6-7 question assessment to test concepts.</p>
                  </button>

                  <button
                    onClick={() => onNavigateTab("courses")}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 transition-all group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">Explore Courses</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Study lessons and video modules to build mastery.</p>
                  </button>

                  <button
                    onClick={() => onNavigateTab("assignments")}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 transition-all group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">Assignments</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Submit homework and project files for teacher grading.</p>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Top 4 Real-time Cognitive Metacognition Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Reasoning Depth */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <Brain className="w-4 h-4" /> Reasoning Depth
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      {twinProfile.reasoning_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${twinProfile.reasoning_score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Evaluates algorithmic derivation vs memorized patterns.
                  </p>
                </div>

                {/* Knowledge Transfer */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Compass className="w-4 h-4 text-amber-500" /> Concept Transfer
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      {twinProfile.concept_transfer_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        twinProfile.concept_transfer_score < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${twinProfile.concept_transfer_score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ability to apply learned principles to unfamiliar real-world tasks.
                  </p>
                </div>

                {/* Knowledge Retention */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Activity className="w-4 h-4 text-emerald-500" /> Retention Curve
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      {twinProfile.retention_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${twinProfile.retention_score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Spaced repetition model predicting memory decay over 14 days.
                  </p>
                </div>

                {/* Confidence Calibration */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <Layers className="w-4 h-4 text-purple-500" /> Confidence Match
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      {twinProfile.confidence_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${twinProfile.confidence_score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Calibrates stated confidence with empirical problem outcomes.
                  </p>
                </div>
              </div>

              {/* Main Dual Grid: Concept Graph + Telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Detailed Multi-Dimensional Concept Mastery Grid */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        Concept Mastery & Transfer Diagnostic Matrix
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Probabilistic Bayesian mastery mapping updated on every action.
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {Object.keys(twinProfile.concept_mastery).length} Tracked Concepts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(twinProfile.concept_mastery).map(([key, rawNode]) => {
                      const node: ConceptMasteryNode = typeof rawNode === "number"
                        ? {
                            concept: key,
                            masteryScore: rawNode,
                            confidenceLevel: 75,
                            evidenceCount: 5,
                            retentionStability: 80,
                            transferAbility: 65,
                            lastTested: "Recently",
                            predictedDecayDays: 14
                          }
                        : rawNode;

                      return (
                        <div 
                          key={key} 
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            node.masteryScore < 60
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                              : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-xs text-slate-900 dark:text-white">{key}</h3>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                Retention Stability: <strong className="text-indigo-600 dark:text-indigo-400">{node.retentionStability}%</strong>
                              </span>
                            </div>

                            <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                              node.masteryScore >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              node.masteryScore >= 60 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {node.masteryScore}%
                            </span>
                          </div>

                          {/* Micro Progress Bars */}
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between text-slate-500">
                              <span>Transfer Ability</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{node.transferAbility}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${node.transferAbility < 50 ? 'bg-amber-500' : 'bg-teal-500'}`}
                                style={{ width: `${node.transferAbility}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400">
                            <span>Evidence Count: <strong>{node.evidenceCount}x</strong></span>
                            <span>Confidence: <strong>{node.confidenceLevel}%</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 1 Col: Cognitive Telemetry & Guesses vs Reasoning */}
                <div className="space-y-4">
                  {/* Telemetry Breakdown */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                      Cognitive Reasoning Telemetry
                    </h3>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Reasoning Depth</span>
                          <strong className="text-emerald-600 dark:text-emerald-400">{twinProfile.guessing_vs_reasoning.reasoning_depth}%</strong>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${twinProfile.guessing_vs_reasoning.reasoning_depth}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Guessing Tendency</span>
                          <strong className="text-amber-600 dark:text-amber-400">{twinProfile.guessing_vs_reasoning.guessing_tendency}%</strong>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${twinProfile.guessing_vs_reasoning.guessing_tendency}%` }} />
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Avg Response Time:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{twinProfile.response_time_avg_sec}s</strong>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Explanation Depth:</span>
                        <strong className="text-indigo-600 dark:text-indigo-400">{twinProfile.explanation_ability.depthRating}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Learning Preferences */}
                  {twinProfile.learning_preferences.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Twin Learning Modality
                      </h3>

                      <div className="flex flex-wrap gap-2">
                        {twinProfile.learning_preferences.map((pref, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60"
                          >
                            {pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Dynamic Events */}
                  {twinProfile.recent_behavior.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Recent Behavior Logs
                      </h3>

                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {twinProfile.recent_behavior.map((b, idx) => (
                          <div 
                            key={`${b.id || 'act'}-${idx}`}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{b.actionType.replace('_', ' ').toUpperCase()}</span>
                              <span>{b.timestamp}</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px]">{b.summary}</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">{b.deltaImpact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENT TAB: FUTURE FAILURE SIMULATOR                                     */}
      {/* ========================================================================= */}
      {!isTeacherOrAdmin && activeSubTab === 'failure_simulator' && (
        <div className="space-y-6">
          {twinProfile.predicted_risks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Projected Failure Risks</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {Object.keys(twinProfile.concept_mastery).length === 0
                    ? "Complete course quizzes or assignments to begin real-time risk modeling."
                    : "Excellent work! All assessed concepts have demonstrated solid mastery with no knowledge transfer gaps detected."}
                </p>
              </div>
              {roleUpper === "STUDENT" && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("quizzes")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Take a Diagnostic Quiz
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Predicted Risk Probability Cards */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      Predicted Exam/Project Risks
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Failure simulations derived from historical concept transfer deficits.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {twinProfile.predicted_risks.map((risk, idx) => (
                      <button
                        key={`${risk.id || 'sim-risk'}-${idx}`}
                        onClick={() => {
                          setActiveSimRisk(risk);
                          setSimSelectedOption(null);
                          setSimSubmitted(false);
                          setSimFeedback(null);
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all space-y-2 ${
                          activeSimRisk?.id === risk.id
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{risk.concept}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            risk.riskScore >= 70 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                            risk.riskScore >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {risk.riskScore}% Failure Risk
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {risk.reason}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-indigo-600 dark:text-indigo-400 font-bold pt-1">
                          <span>Current Mastery: {risk.currentMastery}%</span>
                          <span className="flex items-center gap-1">
                            Launch Sim <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 2 Columns: Live Interactive Stress-Test Mission Sandbox */}
              <div className="lg:col-span-2">
                {activeSimRisk?.simulatorScenario ? (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                        Live Stress-Test Mission: {activeSimRisk.concept}
                      </span>
                      <span className="text-xs text-slate-400">
                        Transfer Gap Verification
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {activeSimRisk.simulatorScenario.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {activeSimRisk.simulatorScenario.description}
                      </p>
                    </div>

                    {activeSimRisk.simulatorScenario.codeOrProblem && (
                      <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                        <code>{activeSimRisk.simulatorScenario.codeOrProblem}</code>
                      </pre>
                    )}

                    {/* Interactive Options */}
                    <div className="space-y-3">
                      {activeSimRisk.simulatorScenario.options.map((optionText, idx) => (
                        <button
                          key={idx}
                          disabled={simSubmitted}
                          onClick={() => handleExecuteSimulation(activeSimRisk, idx)}
                          className={`w-full text-left p-4 rounded-2xl border text-xs transition-all flex items-start justify-between gap-3 ${
                            simSelectedOption === idx
                              ? simFeedback?.isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200'
                                : 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-950 dark:text-red-200'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-medium leading-relaxed">{optionText}</span>
                          </div>

                          {simSubmitted && idx === activeSimRisk.simulatorScenario!.correctChoice && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          {simSubmitted && simSelectedOption === idx && !simFeedback?.isCorrect && (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Feedback Output Banner */}
                    {simFeedback && (
                      <div className={`p-4 rounded-2xl text-xs space-y-3 animate-in fade-in ${
                        simFeedback.isCorrect
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      }`}>
                        <div className="font-bold flex items-center gap-1.5 text-sm">
                          {simFeedback.isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Stress Test Cleared Successfully!</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Simulation Outcome: Risk Confirmed</span>
                            </>
                          )}
                        </div>

                        <p className="leading-relaxed text-[11px]">{simFeedback.message}</p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              setSimSubmitted(false);
                              setSimSelectedOption(null);
                              setSimFeedback(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-[11px] shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                          >
                            Reset & Retake
                          </button>

                          {!simFeedback.isCorrect && (
                            <button
                              onClick={onOpenAiAssistant}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-[11px] shadow-xs hover:bg-indigo-700 transition-all flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              Ask Socratic AI for Clue
                            </button>
                          )}

                          {simFeedback.isCorrect && twinProfile.predicted_risks.length > 0 && (
                            <button
                              onClick={() => {
                                const nextRisk = twinProfile.predicted_risks[0];
                                setActiveSimRisk(nextRisk);
                                setSimSubmitted(false);
                                setSimSelectedOption(null);
                                setSimFeedback(null);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] shadow-xs hover:bg-emerald-700 transition-all flex items-center gap-1"
                            >
                              <span>Proceed to Next Challenge</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {simFeedback.isCorrect && (
                            <button
                              onClick={() => setActiveSubTab('twin')}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-300 transition-all"
                            >
                              View Cognitive Twin Overview
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center py-16 text-xs text-slate-500">
                    Select a predicted failure risk from the list to launch the live scenario simulation.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENT TAB: TARGETED ADAPTIVE INTERVENTIONS                              */}
      {/* ========================================================================= */}
      {!isTeacherOrAdmin && activeSubTab === 'interventions' && (
        <div className="space-y-6">
          {twinProfile.recommended_interventions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Target className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Interventions Required</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {Object.keys(twinProfile.concept_mastery).length === 0
                    ? "Interventions and targeted missions will generate automatically based on real performance on quizzes and assignments."
                    : "All concepts are currently well-balanced. No remedial interventions needed at this time."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {twinProfile.recommended_interventions.map((intervention, idx) => (
                <div 
                  key={`${intervention.id || 'int'}-${idx}`}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {intervention.type.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        intervention.urgency === 'High' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {intervention.urgency} Priority • {intervention.estimatedMinutes} mins
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{intervention.title}</h3>
                      <span className="text-[10px] text-slate-400">Target Concept: {intervention.concept}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {intervention.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setActiveSubTab('failure_simulator');
                        setSimSubmitted(false);
                        setSimSelectedOption(null);
                        setSimFeedback(null);
                        const r = twinProfile.predicted_risks.find(p => p.concept === intervention.concept);
                        if (r) {
                          setActiveSimRisk(r);
                        } else if (intervention.missionScenario) {
                          const synthRisk: PredictedRisk = {
                            id: `synth-risk-${Date.now()}`,
                            concept: intervention.concept,
                            riskScore: intervention.urgency === 'High' ? 75 : 55,
                            reason: intervention.description,
                            recommendedIntervention: intervention.title,
                            contextTrigger: `When building applications utilizing ${intervention.concept}`,
                            currentMastery: 50,
                            prerequisitesMastered: [{ concept: `${intervention.concept} Basics`, score: 70 }],
                            simulatorScenario: intervention.missionScenario
                          };
                          setActiveSimRisk(synthRisk);
                        } else {
                          onOpenAiAssistant();
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Launch Targeted Mission</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
