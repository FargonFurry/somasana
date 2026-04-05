const Translation = (() => {
  const resources = {
    en: {
      translation: {
        "welcome": "Welcome Back",
        "home": "Home",
        "study": "Study",
        "plan": "Plan",
        "community": "Community",
        "rewards": "Rewards",
        "settings": "Settings",
        "generate_paper": "Generate Practice Paper",
        "topic_placeholder": "e.g. Simultaneous Equations",
        "difficulty": "Difficulty",
        "questions": "Questions",
        "focus_mode": "Focus Mode",
        "ghost_race": "Ghost Race",
        "submit_marking": "Submit for AI Marking",
        "recent_papers": "Recent Papers",
        "archive": "Archive",
        "friends": "Friends",
        "forum": "Forum",
        "active_goals": "Active Goals",
        "study_calendar": "Study Calendar",
        "weekly_schedule": "Weekly Schedule",
        "xp_gained": "XP Gained",
        "coins": "StudyCoins"
      }
    },
    sw: {
      translation: {
        "welcome": "Karibu Tena",
        "home": "Nyumbani",
        "study": "Soma",
        "plan": "Mpango",
        "community": "Jamii",
        "rewards": "Zawadi",
        "settings": "Mipangilio",
        "generate_paper": "Tengeneza Karatasi ya Mazoezi",
        "topic_placeholder": "mfano: Milinganyo ya Pamoja",
        "difficulty": "Ugumu",
        "questions": "Maswali",
        "focus_mode": "Hali ya Kuzingatia",
        "ghost_race": "Mbio za Ghost",
        "submit_marking": "Wasilisha kwa Sahihisho la AI",
        "recent_papers": "Karatasi za Hivi Karibuni",
        "archive": "Kumbukumbu",
        "friends": "Marafiki",
        "forum": "Jukwaa",
        "active_goals": "Malengo ya Sasa",
        "study_calendar": "Kalenda ya Masomo",
        "weekly_schedule": "Ratiba ya Wiki",
        "xp_gained": "XP Ulizopata",
        "coins": "StudyCoins"
      }
    }
  };

  async function init() {
    const savedLng = localStorage.getItem('language') || 'en';
    await i18next.init({
      lng: savedLng,
      debug: false,
      resources
    });
    UI.applyTranslations();
  }

  function changeLanguage(lng) {
    i18next.changeLanguage(lng, () => {
      localStorage.setItem('language', lng);
      UI.applyTranslations();
    });
  }

  return { init, changeLanguage };
})();
window.Translation = Translation;
