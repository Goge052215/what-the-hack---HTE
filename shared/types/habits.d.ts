export type HabitSession = {
  id: string;
  userId: string;
  habitId: string;
  timestamp: string;
  durationMin: number;
  focusScore: number;
  breakTaken: boolean;
};

export type HabitMetrics = {
  streakDays: number;
  automaticityProgress: number;
  consistency7d: number;
  consistency30d: number;
  didToday: boolean;
  todayScore: number;
  totalSessions: number;
  lastSessionAt: string | null;
  focusAverage: number | null;
  focusByHour: Record<string, number>;
};

export type Habit = {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  sessions: HabitSession[];
  metrics: HabitMetrics;
};
