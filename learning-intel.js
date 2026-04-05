const LearningIntel = (() => {
  /**
   * SM-2 Algorithm Implementation
   * @param {Object} card - The flashcard object
   * @param {number} quality - Quality of response (0-5)
   * @returns {Object} Updated card properties
   */
  function calculateNextReview(card, quality) {
    let { repetitions, ease_factor, interval } = card;

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease_factor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
      repetitions,
      ease_factor,
      interval,
      next_review: nextReview.toISOString()
    };
  }

  async function getWeakTopics() {
    const user = Auth.currentUser();
    if (!user) return [];
    
    try {
      const { data } = await supabase
        .from('flashcards')
        .select('front, ease_factor')
        .eq('user_id', user.id)
        .lt('ease_factor', 2.0)
        .limit(5);
      
      return data?.map(c => c.front) || [];
    } catch (e) {
      console.error('Error fetching weak topics:', e);
      return [];
    }
  }

  async function getRecommendations() {
    const user = Auth.currentUser();
    if (!user) return "Sign in to see recommendations.";

    try {
      const weakTopics = await getWeakTopics();
      if (weakTopics.length > 0) {
        return `Focus on: ${weakTopics.slice(0, 2).join(', ')}. Your ease factor is low here.`;
      }
      
      const { count } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review', new Date().toISOString());
      
      if (count > 0) {
        return `You have ${count} flashcards due for review. Keep the streak alive!`;
      }

      return "You're all caught up! Why not generate a new practice paper?";
    } catch (e) {
      return "Keep studying!";
    }
  }

  return { calculateNextReview, getWeakTopics, getRecommendations };
})();
window.LearningIntel = LearningIntel;
