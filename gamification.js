const Gamification = (() => {
  async function awardStudyCoins(userId, amount, reason) {
    if (!userId) return;
    await Health.monitor('Gamification.awardStudyCoins', async () => {
      const { data: stats } = await supabase.from('user_stats').select('study_coins').eq('user_id', userId).maybeSingle();
      const currentCoins = stats?.study_coins || 0;
      const { error } = await supabase.from('user_stats').upsert({ user_id: userId, study_coins: currentCoins + amount }, { onConflict: 'user_id' });
      if (error) throw error;
      UI.showNotification(`+${amount} StudyCoins! (${reason})`, 'success');
    }, { showLoader: false });
  }

  async function awardXP(userId, amount, reason) {
    if (!userId) return;
    await Health.monitor('Gamification.awardXP', async () => {
      const { data: stats } = await supabase.from('user_stats').select('xp, level').eq('user_id', userId).maybeSingle();
      const currentXP = stats?.xp || 0;
      const currentLevel = stats?.level || 1;
      const newXP = currentXP + amount;
      const nextLevelXP = currentLevel * 1000;
      
      let newLevel = currentLevel;
      if (newXP >= nextLevelXP) {
        newLevel++;
        UI.showNotification(`Level Up! You are now Level ${newLevel}`, 'success');
        await checkMilestones(userId, 'level', newLevel);
      }
      
      const { error } = await supabase.from('user_stats').upsert({ 
        user_id: userId, 
        xp: newXP, 
        level: newLevel 
      }, { onConflict: 'user_id' });
      if (error) throw error;
      
      UI.showNotification(`+${amount} XP! (${reason})`, 'success');
    }, { showLoader: false });
  }

  async function updateStreak(userId) {
    if (!userId) return;
    await Health.monitor('Gamification.updateStreak', async () => {
      const { data: stats } = await supabase.from('user_stats').select('streak, last_study_date').eq('user_id', userId).maybeSingle();
      const today = new Date().toISOString().split('T')[0];
      const lastDate = stats?.last_study_date;
      let newStreak = stats?.streak || 0;

      if (lastDate === today) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        newStreak++;
      } else {
        newStreak = 1;
      }

      const { error } = await supabase.from('user_stats').upsert({
        user_id: userId,
        streak: newStreak,
        last_study_date: today
      }, { onConflict: 'user_id' });
      if (error) throw error;

      if (newStreak > 1) {
        UI.showNotification(`${newStreak} Day Streak! 🔥`, 'success');
      }
      
      await checkMilestones(userId, 'streak', newStreak);
    }, { showLoader: false });
  }

  async function checkMilestones(userId, type, value) {
    if (type === 'streak') {
      if (value === 7) await Badges.awardBadge('streak_7');
      if (value === 30) await Badges.awardBadge('streak_30');
    }
    if (type === 'level') {
      if (value === 5) await Badges.awardBadge('level_5');
      if (value === 10) await Badges.awardBadge('level_10');
    }
    if (type === 'accuracy' && value === 100) {
      await Badges.awardBadge('perfect_score');
    }
  }

  return { awardStudyCoins, awardXP, updateStreak, checkMilestones };
})();
window.Gamification = Gamification;
