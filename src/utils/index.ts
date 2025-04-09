import { v4 as uuidv4 } from "uuid";
import { TimetableEntry, Subject, Teacher, ValidationError } from "../types";
import { ERROR_SEVERITY } from "../constants";

/**
 * Generates a unique ID for timetable entries
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Creates a formatted string representation of a time slot
 */
export const formatTimeSlot = (day: string, period: number): string => {
  return `${day}-${period}`;
};

/**
 * Generates a formatted ID for validation errors
 */
export const generateErrorId = (message: string): string => {
  return `error-${message.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
};

/**
 * Counts the number of lectures assigned for each subject
 */
export const countSubjectLectures = (
  timetableEntries: TimetableEntry[],
  subjects: Subject[]
): Record<number, number> => {
  const counts: Record<number, number> = {};

  // Initialize counts
  subjects.forEach((subject) => {
    counts[subject.id] = 0;
  });

  // Count occurrences
  timetableEntries.forEach((entry) => {
    if (counts[entry.subjectId] !== undefined) {
      counts[entry.subjectId]++;
    }
  });

  return counts;
};

/**
 * Get all time slots for a specific day
 */
export const getTimeSlotsForDay = (
  day: string,
  periodsPerDay: number
): { day: string; period: number }[] => {
  const slots = [];
  for (let period = 1; period <= periodsPerDay; period++) {
    slots.push({ day, period });
  }
  return slots;
};

/**
 * Checks if a teacher has any conflicting assignments
 */
export const checkTeacherConflicts = (
  teacher: Teacher,
  timetableEntries: TimetableEntry[]
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const teacherSlots: Record<string, TimetableEntry> = {};

  // Find all slots where this teacher is assigned
  const teacherEntries = timetableEntries.filter(
    (entry) => entry.teacherId === teacher.id
  );

  // Check for double bookings
  teacherEntries.forEach((entry) => {
    const slotKey = formatTimeSlot(entry.day, entry.period);

    if (teacherSlots[slotKey]) {
      errors.push({
        id: generateErrorId(`Teacher ${teacher.name} double-booking`),
        message: `${teacher.name} is double-booked on ${entry.day} period ${entry.period}`,
        severity: ERROR_SEVERITY.ERROR as "error" | "warning",
      });
    }

    teacherSlots[slotKey] = entry;
  });

  // Check for availability
  teacherEntries.forEach((entry) => {
    const isAvailable = teacher.availableSlots.some(
      (slot) => slot.day === entry.day && slot.period === entry.period
    );

    if (!isAvailable) {
      errors.push({
        id: generateErrorId(`Teacher ${teacher.name} availability`),
        message: `${teacher.name} is not available on ${entry.day} period ${entry.period}`,
        severity: ERROR_SEVERITY.ERROR as "error" | "warning",
      });
    }
  });

  return errors;
};

/**
 * Find optimal slot for a subject based on distribution requirements
 */
export const findOptimalSlot = (
  subject: Subject,
  teacher: Teacher,
  currentEntries: TimetableEntry[],
  days: string[],
  periodsPerDay: number
): { day: string; period: number } | null => {
  // Count entries per day for this subject
  const entriesPerDay: Record<string, number> = {};
  days.forEach((day) => {
    entriesPerDay[day] = currentEntries.filter(
      (entry) => entry.subjectId === subject.id && entry.day === day
    ).length;
  });

  // Find days with fewest entries for this subject
  const sortedDays = [...days].sort(
    (a, b) => entriesPerDay[a] - entriesPerDay[b]
  );

  // For each day (starting with those having fewest entries)
  for (const day of sortedDays) {
    // For each period
    for (let period = 1; period <= periodsPerDay; period++) {
      // Check if slot is available
      const isTeacherAvailable = teacher.availableSlots.some(
        (slot) => slot.day === day && slot.period === period
      );

      // Check if slot is not already taken
      const isSlotTaken = currentEntries.some(
        (entry) => entry.day === day && entry.period === period
      );

      if (isTeacherAvailable && !isSlotTaken) {
        return { day, period };
      }
    }
  }

  return null; // No suitable slot found
};

/**
 * Calculates the distribution score for a timetable
 * Higher score means more evenly distributed subjects
 */
export const calculateDistributionScore = (
  timetableEntries: TimetableEntry[],
  subjects: Subject[],
  days: string[]
): number => {
  let score = 0;

  subjects.forEach((subject) => {
    // Skip subjects with only 1 lecture
    if (subject.weeklyLectures <= 1) return;

    // Count lectures per day for this subject
    const lecturesPerDay: Record<string, number> = {};
    days.forEach((day) => {
      lecturesPerDay[day] = 0;
    });

    timetableEntries
      .filter((entry) => entry.subjectId === subject.id)
      .forEach((entry) => {
        lecturesPerDay[entry.day]++;
      });

    // Calculate standard deviation of lectures per day
    const values = Object.values(lecturesPerDay);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
    const avgSquareDiff =
      squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Lower standard deviation means more even distribution
    // We want to maximize score, so we use 1 / (1 + stdDev)
    const subjectScore = 1 / (1 + stdDev);
    score += subjectScore;
  });

  return score;
};

/**
 * Evaluates timetable for teacher workload balance
 * Lower score is better (more balanced)
 */
export const evaluateTeacherWorkloadBalance = (
  timetableEntries: TimetableEntry[],
  teachers: Teacher[]
): number => {
  // Count lectures per teacher
  const lecturesPerTeacher: Record<number, number> = {};

  teachers.forEach((teacher) => {
    lecturesPerTeacher[teacher.id] = 0;
  });

  timetableEntries.forEach((entry) => {
    if (lecturesPerTeacher[entry.teacherId] !== undefined) {
      lecturesPerTeacher[entry.teacherId]++;
    }
  });

  // Calculate standard deviation of teacher workloads
  const values = Object.values(lecturesPerTeacher);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff =
    squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return stdDev; // Lower is better
};

/**
 * Check for consecutive periods of the same subject
 * Returns array of validation warnings
 */
export const checkConsecutivePeriods = (
  timetableEntries: TimetableEntry[],
  subjects: Subject[],
  days: string[]
): ValidationError[] => {
  const warnings: ValidationError[] = [];

  days.forEach((day) => {
    // Get entries for this day, sorted by period
    const dayEntries = timetableEntries
      .filter((entry) => entry.day === day)
      .sort((a, b) => a.period - b.period);

    // Check for more than 2 consecutive periods of the same subject
    for (let i = 0; i < dayEntries.length - 2; i++) {
      if (
        dayEntries[i].subjectId === dayEntries[i + 1].subjectId &&
        dayEntries[i].subjectId === dayEntries[i + 2].subjectId
      ) {
        const subject = subjects.find((s) => s.id === dayEntries[i].subjectId);

        if (subject) {
          warnings.push({
            id: generateErrorId(`${subject.name} consecutive ${day}`),
            message: `${subject.name} has 3 or more consecutive periods on ${day}`,
            severity: ERROR_SEVERITY.WARNING as "error" | "warning",
          });
        }
      }
    }
  });

  return warnings;
};

/**
 * Suggests improvements for an existing timetable
 * Returns array of possible optimizations
 */
export const suggestTimetableImprovements = (
  timetableEntries: TimetableEntry[],
  subjects: Subject[],
  teachers: Teacher[],
  days: string[]
): string[] => {
  const suggestions: string[] = [];

  // Check distribution score
  const distributionScore = calculateDistributionScore(
    timetableEntries,
    subjects,
    days
  );
  if (distributionScore < subjects.length * 0.7) {
    suggestions.push(
      "Subject distribution could be improved for better learning outcomes."
    );
  }

  // Check teacher workload balance
  const workloadBalance = evaluateTeacherWorkloadBalance(
    timetableEntries,
    teachers
  );
  if (workloadBalance > 2) {
    // More than 2 standard deviation
    suggestions.push("Teacher workloads are not well balanced.");
  }

  // Check for high concentration of difficult subjects on same days
  const difficultSubjects = subjects.filter((s) => s.weeklyLectures >= 4);

  days.forEach((day) => {
    const difficultLecturesOnDay = timetableEntries.filter(
      (entry) =>
        entry.day === day &&
        difficultSubjects.some((s) => s.id === entry.subjectId)
    ).length;

    if (difficultLecturesOnDay > difficultSubjects.length) {
      suggestions.push(
        `${day} has a high concentration of difficult subjects.`
      );
    }
  });

  return suggestions;
};
