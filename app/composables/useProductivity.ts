export interface ProductivityStats {
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;

  // Today stats
  todayCompleted: number;
  todayTotal: number;

  // Weekly stats
  weekCompleted: number;
  weekTotal: number;
  completionRate: number;

  // Overall stats
  totalCompleted: number;
  totalTodos: number;

  // Daily activity (last 7 days)
  dailyActivity: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
}

export function useProductivity() {
  const api = useApi();

  /**
   * Fetch productivity stats from backend
   */
  const fetchProductivity = async (): Promise<ProductivityStats> => {
    return api.get<ProductivityStats>("/analytics/productivity");
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  /**
   * Get streak emoji based on streak length
   */
  const getStreakEmoji = (streak: number): string => {
    if (streak === 0) return "🔥";
    if (streak < 3) return "🔥";
    if (streak < 7) return "🔥🔥";
    if (streak < 14) return "🔥🔥🔥";
    if (streak < 30) return "🔥🔥🔥🔥";
    return "🔥🔥🔥🔥🔥";
  };

  /**
   * Get motivational message based on completion rate
   */
  const getMotivationMessage = (completionRate: number): string => {
    if (completionRate === 0) return "Ayo mulai kerjakan tugas! 💪";
    if (completionRate < 50) return "Tingkatkan lagi produktivitasmu! 📈";
    if (completionRate < 80) return "Bagus! Terus pertahankan! 👍";
    if (completionRate < 100) return "Hampir sempurna! 🌟";
    return "Sempurna! Kamu luar biasa! 🏆";
  };

  /**
   * Get completion rate color class
   */
  const getCompletionRateColor = (rate: number): string => {
    if (rate < 50) return "text-red-500";
    if (rate < 80) return "text-orange-500";
    return "text-green-500";
  };

  return {
    fetchProductivity,
    formatDate,
    getStreakEmoji,
    getMotivationMessage,
    getCompletionRateColor,
  };
}
