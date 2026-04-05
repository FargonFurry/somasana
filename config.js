window.APP_CONFIG = {
  // Core
  appName: 'StudyHub',
  supabaseUrl: 'https://wqiglftolugdoiguzqbd.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaWdsZnRvbHVnZG9pZ3V6cWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDkxMDgsImV4cCI6MjA5MDYyNTEwOH0.Uul7n5_LSawmR0hcC1FUQo91pMd8uDjBXAnlwchDJX4',

  edgeFunctionUrl: 'https://wqiglftolugdoiguzqbd.functions.supabase.co/openai-proxy',
  adminPassword: 'Coolkids@2026!',

  // AI (multi-provider)
  defaultAIProvider: 'deepseek',
  
  // Feature toggles
  features: {
    ghostMode: true,
    liveLeaderboardNotifs: true,
    autoEncouragement: true,
    socialFeedAutoPosts: true,
    examMode: true,
    reviewMode: true,
    errorReplay: true,
    keyboardShortcuts: true,
    smartStudyPlan: true,
    adaptiveRevision: true,
    timetableOptimizer: true,
    dynamicDifficulty: true,
    penaltySkip: true,

    // Phase 1 (Core Learning Experience)
    phase1_dashboard: true,
    phase1_focusMode: true,
    phase1_docUpload: true,
    phase1_hints: true,
    phase1_skipPenalty: true,
    phase1_confidenceTracking: true,
    phase1_timeAnalysis: true,
    phase1_sessionSummary: true,
    phase1_feedbackEngine: true,
    phase1_fixActions: true,
    phase1_focusedDrill: true,
    phase1_mistakePatternEngine: true,

    phase2_skillTree: true,
    phase2_flashcardsTimedRecall: true,
    phase4_communitySocial: true,

    timetable: true,
    goals: true,

    profile: true,
    toastV2: true,
    skeletons: true,
    liveValidation: true,
    shortcuts: true,
    mobileTouchTargets: true,
    badges: true,
    heatmap: true,
    realtimeLeagueNotifs: true,
    leaderboardV2: true,
    shop: true,
    paperRepository: true,
    publicPapers: true,
    paperRatings: true,
    paperAudit: true,
    skillTreeGraph: true,
    accessibility: true,
    i18n: true,
    externalTools: true,
    educator: true,
    offlineEnhancements: true,
  },

  badges: [
    { id: 'first_paper', name: 'First Paper', description: 'Submit your first paper.', condition: 'paper_submitted_1' },
    { id: 'streak_7', name: '7-Day Streak', description: 'Reach a 7 day streak.', condition: 'streak_7' },
    { id: 'helper', name: 'Helper', description: 'Receive 5 upvotes in forums.', condition: 'forum_upvotes_5' },
    { id: 'algebra_master', name: 'Algebra Master', description: 'Score 90%+ in Algebra 3 times.', condition: 'algebra_90x3' },
  ],

  shopItems: [
    { id: 'streak_freeze', name: 'Streak Freeze', description: 'Protect your streak for one missed day.', cost: 10, type: 'consumable' },
    { id: 'hat_basic', name: 'Basic Hat', description: 'A simple hat accessory for your avatar.', cost: 20, type: 'cosmetic' },
    { id: 'glasses_round', name: 'Round Glasses', description: 'A smart look for study sessions.', cost: 15, type: 'cosmetic' },
    { id: 'theme_neon', name: 'Neon Theme', description: 'A vibrant neon accent palette.', cost: 25, type: 'theme' },
  ],

  theme: 'system',
  fontSize: 'medium',
  fontFamily: 'Inter, sans-serif',
  
  defaultTimetable: {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [],
  },
  defaultGoals: [],
};
