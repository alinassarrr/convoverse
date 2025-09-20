export const SummariesConfig = {
  // Scheduling
  SCHEDULER_INTERVAL: 180000, // 3 minutes

  // Processing thresholds
  MIN_MESSAGES_FOR_SUMMARY: 5,
  MAX_AGE_MINUTES_FOR_SUMMARY: 5,
  MAX_MESSAGES_PER_BATCH: 20,

  // Rate limiting
  MIN_API_INTERVAL: 30000, // 30 sec between API calls
  MAX_RETRIES: 3,

  // AI Model
  DEFAULT_MODEL: 'gemini-1.5-flash',
  AI_TEMPERATURE: 0,

  // RAG
  DEFAULT_RAG_TOP_K: 5,

  // Timezone
  TIMEZONE: 'Asia/Beirut',
} as const;

export type SummariesConfigType = typeof SummariesConfig;
