import { create } from "zustand";
import {
  Subject,
  Teacher,
  TimetableEntry,
  ValidationError,
  TimeSlot,
} from "../types";
import { DAYS, PERIODS, ERROR_SEVERITY } from "../constants";
import {
  generateId,
  generateErrorId,
  formatTimeSlot,
  countSubjectLectures,
  checkTeacherConflicts,
  checkConsecutivePeriods,
  suggestTimetableImprovements,
} from "../utils";

// Sample data for testing
const initialSubjects: Subject[] = [
  { id: 1, name: "Mathematics", weeklyLectures: 5 },
  { id: 2, name: "Science", weeklyLectures: 4 },
  { id: 3, name: "English", weeklyLectures: 5 },
  { id: 4, name: "History", weeklyLectures: 3 },
  { id: 5, name: "Geography", weeklyLectures: 2 },
  { id: 6, name: "Physical Education", weeklyLectures: 3 },
  { id: 7, name: "Art", weeklyLectures: 2 },
  { id: 8, name: "Music", weeklyLectures: 1 },
];

// Generate available slots for teachers (Monday to Friday, periods 1-7)
const generateAvailableSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];

  DAYS.forEach((day) => {
    PERIODS.forEach((period) => {
      // Randomly make some slots unavailable (about 20%)
      if (Math.random() > 0.2) {
        slots.push({ day, period });
      }
    });
  });

  return slots;
};

const initialTeachers: Teacher[] = [
  { id: 1, name: "Mr. Smith", availableSlots: generateAvailableSlots() },
  { id: 2, name: "Mrs. Johnson", availableSlots: generateAvailableSlots() },
  { id: 3, name: "Mr. Williams", availableSlots: generateAvailableSlots() },
  { id: 4, name: "Ms. Brown", availableSlots: generateAvailableSlots() },
  { id: 5, name: "Mr. Davis", availableSlots: generateAvailableSlots() },
  { id: 6, name: "Mrs. Miller", availableSlots: generateAvailableSlots() },
];

interface TimetableState {
  // Data
  subjects: Subject[];
  teachers: Teacher[];
  days: string[];
  periodsPerDay: number;
  timetableEntries: TimetableEntry[];
  validationErrors: ValidationError[];

  // Actions
  initializeTimetable: () => void;
  addTimetableEntry: (entry: Omit<TimetableEntry, "id">) => void;
  removeTimetableEntry: (id: string) => void;
  updateTimetableEntry: (id: string, updates: Partial<TimetableEntry>) => void;
  moveTimetableEntry: (
    entryId: string,
    newDay: string,
    newPeriod: number
  ) => void;
  validateTimetable: () => ValidationError[];
  resetTimetable: () => void;
  setSubjects: (subjects: Subject[]) => void;
  setTeachers: (teachers: Teacher[]) => void;
}

/**
 * Create a map of available slots for each teacher
 * This is useful for quick lookups during timetable generation
 */
const createTeacherAvailabilityMap = (
  teachers: Teacher[]
): Record<number, Record<string, boolean>> => {
  const availabilityMap: Record<number, Record<string, boolean>> = {};

  teachers.forEach((teacher) => {
    availabilityMap[teacher.id] = {};

    teacher.availableSlots.forEach((slot) => {
      const key = formatTimeSlot(slot.day, slot.period);
      availabilityMap[teacher.id][key] = true;
    });
  });

  return availabilityMap;
};

/**
 * Assign teachers to subjects based on expertise and availability
 * Returns a map of subject IDs to teacher IDs
 */
const assignTeachersToSubjects = (
  subjects: Subject[],
  teachers: Teacher[]
): Record<number, number> => {
  const teacherAssignments: Record<number, number> = {};

  // Calculate teacher workload potential
  const teacherWorkloads: Record<number, number> = {};
  teachers.forEach((teacher) => {
    teacherWorkloads[teacher.id] = teacher.availableSlots.length;
  });

  // Sort subjects by number of weekly lectures (descending)
  const sortedSubjects = [...subjects].sort(
    (a, b) => b.weeklyLectures - a.weeklyLectures
  );

  // Assign teachers to subjects
  sortedSubjects.forEach((subject) => {
    // Find teacher with most available slots (and lowest current workload)
    const sortedTeachers = [...teachers].sort((a, b) => {
      const aWorkload = teacherWorkloads[a.id] || 0;
      const bWorkload = teacherWorkloads[b.id] || 0;
      return bWorkload - aWorkload;
    });

    // Assign first teacher in sorted list
    const assignedTeacher = sortedTeachers[0];
    teacherAssignments[subject.id] = assignedTeacher.id;

    // Update workload (subtract the subject's weekly lectures)
    teacherWorkloads[assignedTeacher.id] -= subject.weeklyLectures;
  });

  return teacherAssignments;
};

/**
 * Checks if a slot is already taken in the timetable
 */
const isSlotTaken = (
  timetable: TimetableEntry[],
  day: string,
  period: number
): boolean => {
  return timetable.some(
    (entry) => entry.day === day && entry.period === period
  );
};

/**
 * Checks if a teacher is available for a specific slot
 */
const isTeacherAvailable = (
  teacherId: number,
  day: string,
  period: number,
  availabilityMap: Record<number, Record<string, boolean>>
): boolean => {
  const slotKey = formatTimeSlot(day, period);
  return availabilityMap[teacherId]?.[slotKey] || false;
};

/**
 * Find day with fewest lectures for a subject
 */
const findDayWithFewestLectures = (
  subject: Subject,
  timetable: TimetableEntry[],
  days: string[]
): string => {
  const lecturesPerDay: Record<string, number> = {};

  // Initialize counts
  days.forEach((day) => {
    lecturesPerDay[day] = 0;
  });

  // Count lectures per day for this subject
  timetable
    .filter((entry) => entry.subjectId === subject.id)
    .forEach((entry) => {
      lecturesPerDay[entry.day]++;
    });

  // Find day with fewest lectures
  return days.reduce(
    (minDay, day) =>
      lecturesPerDay[day] < lecturesPerDay[minDay] ? day : minDay,
    days[0]
  );
};

/**
 * Advanced timetable generation algorithm
 * Implements constraints and even distribution of subjects
 */
const generateTimetable = (
  subjects: Subject[],
  teachers: Teacher[],
  days: string[],
  periodsPerDay: number
): TimetableEntry[] => {
  const timetable: TimetableEntry[] = [];

  // Create teacher availability map for quick lookups
  const teacherAvailabilityMap = createTeacherAvailabilityMap(teachers);

  // Assign teachers to subjects
  const subjectTeacherMap = assignTeachersToSubjects(subjects, teachers);

  // Create a distribution plan for subjects
  // Sort subjects by number of weekly lectures (descending)
  const subjectsToSchedule = [...subjects].sort(
    (a, b) => b.weeklyLectures - a.weeklyLectures
  );

  // Keep track of how many lectures we've scheduled for each subject
  const scheduledLectures: Record<number, number> = {};
  subjects.forEach((subject) => {
    scheduledLectures[subject.id] = 0;
  });

  // Keep track of slots that are already filled
  const filledSlots: Record<string, boolean> = {};

  // First pass: Try to distribute subjects evenly across days
  let allSubjectsScheduled = false;
  let maxAttempts = 1000; // Safety measure to prevent infinite loops

  while (!allSubjectsScheduled && maxAttempts > 0) {
    allSubjectsScheduled = true;
    maxAttempts--;

    for (const subject of subjectsToSchedule) {
      // Skip if all lectures for this subject are scheduled
      if (scheduledLectures[subject.id] >= subject.weeklyLectures) {
        continue;
      }

      // We still have lectures to schedule
      allSubjectsScheduled = false;

      // Get assigned teacher
      const teacherId = subjectTeacherMap[subject.id];
      if (!teacherId) continue;

      // Find day with fewest lectures for this subject
      const targetDay = findDayWithFewestLectures(subject, timetable, days);

      // Try to find a period on this day
      let slotFound = false;

      for (let period = 1; period <= periodsPerDay; period++) {
        const slotKey = formatTimeSlot(targetDay, period);

        // Skip if slot is already filled
        if (filledSlots[slotKey]) continue;

        // Check teacher availability
        if (
          !isTeacherAvailable(
            teacherId,
            targetDay,
            period,
            teacherAvailabilityMap
          )
        ) {
          continue;
        }

        // Check if teacher is already booked in this slot
        const isTeacherBookedElsewhere = timetable.some(
          (entry) =>
            entry.teacherId === teacherId &&
            entry.day === targetDay &&
            entry.period === period
        );

        if (isTeacherBookedElsewhere) continue;

        // We found a suitable slot
        timetable.push({
          id: generateId(),
          subjectId: subject.id,
          teacherId,
          day: targetDay,
          period,
        });

        // Mark slot as filled
        filledSlots[slotKey] = true;

        // Update scheduled lectures count
        scheduledLectures[subject.id]++;

        slotFound = true;
        break;
      }

      // If no slot was found on preferred day, try other days
      if (!slotFound) {
        // Try other days in order
        for (const day of days) {
          if (day === targetDay) continue; // Skip the day we already tried

          for (let period = 1; period <= periodsPerDay; period++) {
            const slotKey = formatTimeSlot(day, period);

            // Skip if slot is already filled
            if (filledSlots[slotKey]) continue;

            // Check teacher availability
            if (
              !isTeacherAvailable(
                teacherId,
                day,
                period,
                teacherAvailabilityMap
              )
            ) {
              continue;
            }

            // Check if teacher is already booked in this slot
            const isTeacherBookedElsewhere = timetable.some(
              (entry) =>
                entry.teacherId === teacherId &&
                entry.day === day &&
                entry.period === period
            );

            if (isTeacherBookedElsewhere) continue;

            // We found a suitable slot
            timetable.push({
              id: generateId(),
              subjectId: subject.id,
              teacherId,
              day,
              period,
            });

            // Mark slot as filled
            filledSlots[slotKey] = true;

            // Update scheduled lectures count
            scheduledLectures[subject.id]++;

            slotFound = true;
            break;
          }

          if (slotFound) break;
        }
      }
    }
  }

  return timetable;
};

export const useTimetableStore = create<TimetableState>()((set, get) => ({
  // Initial state
  subjects: initialSubjects,
  teachers: initialTeachers,
  days: DAYS,
  periodsPerDay: PERIODS.length,
  timetableEntries: [],
  validationErrors: [],

  // Actions
  initializeTimetable: () => {
    const { subjects, teachers, days, periodsPerDay } = get();
    const initialTimetable = generateTimetable(
      subjects,
      teachers,
      days,
      periodsPerDay
    );
    set({ timetableEntries: initialTimetable });
    get().validateTimetable();
  },

  addTimetableEntry: (entry) => {
    const newEntry = { ...entry, id: generateId() };
    set((state) => ({
      timetableEntries: [...state.timetableEntries, newEntry],
    }));
    // Validate after adding
    get().validateTimetable();
  },

  removeTimetableEntry: (id) => {
    set((state) => ({
      timetableEntries: state.timetableEntries.filter(
        (entry) => entry.id !== id
      ),
    }));
    // Validate after removing
    get().validateTimetable();
  },

  updateTimetableEntry: (id, updates) => {
    set((state) => ({
      timetableEntries: state.timetableEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    }));
    // Validate after updating
    get().validateTimetable();
  },

  moveTimetableEntry: (entryId, newDay, newPeriod) => {
    const { timetableEntries, teachers } = get();
    const entryToMove = timetableEntries.find((entry) => entry.id === entryId);

    if (!entryToMove) return;

    // Check if the target slot is empty
    const isSlotEmpty = !timetableEntries.some(
      (entry) =>
        entry.id !== entryId &&
        entry.day === newDay &&
        entry.period === newPeriod
    );

    // Check if teacher is available for this slot
    const teacher = teachers.find((t) => t.id === entryToMove.teacherId);
    const isTeacherAvailable = teacher?.availableSlots.some(
      (slot) => slot.day === newDay && slot.period === newPeriod
    );

    if (isSlotEmpty && isTeacherAvailable) {
      set((state) => ({
        timetableEntries: state.timetableEntries.map((entry) =>
          entry.id === entryId
            ? { ...entry, day: newDay, period: newPeriod }
            : entry
        ),
      }));
      // Validate after moving
      get().validateTimetable();
    } else {
      // Add an error for invalid move
      const errorMessage = !isSlotEmpty
        ? "Cannot move lecture to an occupied slot"
        : "Teacher is not available for this time slot";

      set((state) => ({
        validationErrors: [
          ...state.validationErrors,
          {
            id: generateErrorId(errorMessage),
            message: errorMessage,
            severity: ERROR_SEVERITY.ERROR as "error" | "warning",
          },
        ],
      }));
    }
  },

  validateTimetable: () => {
    const { timetableEntries, subjects, teachers, days } = get();
    const errors: ValidationError[] = [];

    // Check 1: Each subject has the correct number of lectures
    const subjectLectureCounts = countSubjectLectures(
      timetableEntries,
      subjects
    );

    subjects.forEach((subject) => {
      const lectureCount = subjectLectureCounts[subject.id] || 0;

      if (lectureCount < subject.weeklyLectures) {
        errors.push({
          id: generateErrorId(`${subject.name} lectures insufficient`),
          message: `${subject.name} has only ${lectureCount} of ${subject.weeklyLectures} required lectures`,
          severity: ERROR_SEVERITY.ERROR as "error" | "warning",
        });
      } else if (lectureCount > subject.weeklyLectures) {
        errors.push({
          id: generateErrorId(`${subject.name} lectures excess`),
          message: `${subject.name} has ${lectureCount} lectures but only ${subject.weeklyLectures} are required`,
          severity: ERROR_SEVERITY.ERROR as "error" | "warning",
        });
      }

      // Check for subject distribution (no more than 1 lecture per day for most subjects)
      // This could be just a warning for some subjects
      const subjectEntriesByDay: Record<string, number> = {};
      days.forEach((day) => {
        subjectEntriesByDay[day] = 0;
      });

      timetableEntries
        .filter((entry) => entry.subjectId === subject.id)
        .forEach((entry) => {
          subjectEntriesByDay[entry.day]++;
        });

      // Subjects with more than 5 lectures (e.g. "Mathematics" with 5) should have at most 1 per day
      // Other subjects with fewer lectures (e.g. "Music" with 1) can have different distributions
      if (subject.weeklyLectures <= days.length) {
        days.forEach((day) => {
          if (subjectEntriesByDay[day] > 1) {
            errors.push({
              id: generateErrorId(`${subject.name} distribution ${day}`),
              message: `${subject.name} has ${subjectEntriesByDay[day]} lectures on ${day}, but should have at most 1`,
              severity: ERROR_SEVERITY.WARNING as "error" | "warning",
            });
          }
        });
      }
    });

    // Check 2: No teacher conflicts
    teachers.forEach((teacher) => {
      const teacherErrors = checkTeacherConflicts(teacher, timetableEntries);
      errors.push(...teacherErrors);
    });

    // Check 3: Check for consecutive periods of the same subject
    const consecutivePeriodWarnings = checkConsecutivePeriods(
      timetableEntries,
      subjects,
      days
    );
    errors.push(...consecutivePeriodWarnings);

    // Check 4: Check for empty time slots that could be better utilized
    // This is a warning rather than an error
    const allSlots = days.flatMap((day) =>
      Array.from({ length: PERIODS.length }, (_, i) => ({
        day,
        period: i + 1,
      }))
    );

    const emptySlots = allSlots.filter(
      (slot) =>
        !timetableEntries.some(
          (entry) => entry.day === slot.day && entry.period === slot.period
        )
    );

    if (emptySlots.length > 0) {
      // Only add a warning if there are subjects that need more lectures
      const subjectsNeedingLectures = subjects.filter(
        (subject) =>
          (subjectLectureCounts[subject.id] || 0) < subject.weeklyLectures
      );

      if (subjectsNeedingLectures.length > 0) {
        errors.push({
          id: generateErrorId("empty-slots-warning"),
          message: `There are ${emptySlots.length} empty slots that could be used for subjects needing more lectures`,
          severity: ERROR_SEVERITY.WARNING as "error" | "warning",
        });
      }
    }

    // Check 5: Add improvement suggestions
    const suggestions = suggestTimetableImprovements(
      timetableEntries,
      subjects,
      teachers,
      days
    );
    suggestions.forEach((suggestion) => {
      errors.push({
        id: generateErrorId(`suggestion-${suggestion.substring(0, 20)}`),
        message: suggestion,
        severity: ERROR_SEVERITY.WARNING as "error" | "warning",
      });
    });

    // Update validation errors in state
    set({ validationErrors: errors });

    return errors;
  },

  resetTimetable: () => {
    set({ timetableEntries: [], validationErrors: [] });
  },

  setSubjects: (subjects) => {
    set({ subjects });
  },

  setTeachers: (teachers) => {
    set({ teachers });
  },
}));
