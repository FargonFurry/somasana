# StudyHub – AI Study Assistant

StudyHub is a comprehensive, AI-powered study platform designed to enhance the learning experience through personalized practice, social collaboration, and gamified progress tracking.

## 🚀 Features

### 📚 Study & Learning
- **AI Practice Papers:** Generate custom practice papers based on any topic and difficulty level.
- **Document Processing:** Upload PDF, DOCX, or TXT files for AI-driven summarization and question generation.
- **Spaced Repetition (Flashcards):** Automatically create flashcards from study mistakes using the SM-2 algorithm.
- **Focus Mode:** Dedicated study timer and distraction-free environment.
- **Ghost Race:** Compete against a "ghost" to stay motivated during study sessions.

### 📅 Planning & Organization
- **Interactive Timetable:** Manage your weekly schedule with drag-and-drop support.
- **Goal Tracking:** Set and track daily, weekly, and long-term study goals.
- **AI Schedule Optimization:** Let AI help you optimize your study plan.

### 🤝 Social & Community
- **Real-Time Presence:** See who's online and studying in real-time.
- **E2EE Messaging:** Secure, end-to-end encrypted chat for private study discussions.
- **Activity Feed:** Stay updated with community milestones and forum posts.
- **Friends System:** Connect with peers and track each other's progress.

### 🎮 Gamification
- **StudyCoins & XP:** Earn rewards for completing study tasks and achieving goals.
- **Study Shop:** Purchase cosmetics, streak freezes, and XP boosts.
- **Badges:** Unlock achievements as you progress through your learning journey.

### 🌍 Accessibility & Localization
- **Multi-Language Support:** Available in English and Swahili.
- **Accessibility Toggles:** Support for Dyslexia Mode, High Contrast, and Dark Mode.

## 🛠️ Tech Stack

- **Frontend:** HTML5, Tailwind CSS, JavaScript (ES6+), Vite.
- **Backend:** Supabase (Auth, Database, Real-time, Edge Functions).
- **AI:** Google Gemini API (via Supabase Edge Functions).
- **i18n:** i18next.
- **UI Components:** Lucide Icons, Driver.js (for tours).

## 🚀 Getting Started

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file based on `.env.example` and add your Supabase and Gemini credentials.
4. **Run the development server:**
   ```bash
   npm run dev
   ```
5. **Build for production:**
   ```bash
   npm run build
   ```

## 📄 License

This project is licensed under the MIT License.
