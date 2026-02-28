export type ScheduleBlock = {
  start: string;
  type: "focus" | "break";
  duration: number;
  task?: string;
};

export type GeneratedSchedule = {
  cycle: "pomodoro" | "ultradian";
  startTime: string;
  blocks: ScheduleBlock[];
  totalMinutes: number;
};
