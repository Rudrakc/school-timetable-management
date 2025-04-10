import { v4 as uuidv4 } from "uuid";

/**
 * Generates a unique ID for timetable entries
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Format a day and period into a string key
 */
export const formatTimeSlot = (day: string, period: number): string => {
  return `${day}-${period}`;
};
