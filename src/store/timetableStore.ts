import { create } from "zustand";
import { Subject, Teacher, TimetableEntry, TimeSlot, Class } from "../types";
import { DAYS, PERIODS } from "../constants";
import { generateId } from "../utils";

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

// Initial classes
const initialClasses: Class[] = [
  { id: "class-a", name: "Class A" },
  { id: "class-b", name: "Class B" },
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

// Helper function to generate a simple timetable (simplified version)
const generateTimetable = (
  subjects: Subject[],
  teachers: Teacher[],
  days: string[],
  periodsPerDay: number
): TimetableEntry[] => {
  // This is a placeholder - in a real app, this would have intelligent assignment logic
  return [];
};

interface TimetableState {
  // Data
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  activeClassId: string;
  days: string[];
  periodsPerDay: number;
  timetableEntries: TimetableEntry[];

  // Class management
  addClass: (className: string) => void;
  removeClass: (classId: string) => void;
  setActiveClass: (classId: string) => void;

  // Timetable management
  addTimetableEntry: (entry: Omit<TimetableEntry, "id">) => void;
  removeTimetableEntry: (id: string) => void;
  updateTimetableEntry: (id: string, updates: Partial<TimetableEntry>) => void;
  moveTimetableEntry: (
    entryId: string,
    newDay: string,
    newPeriod: number
  ) => boolean;
  validateTimetable: () => void; // Keep as no-op to avoid breaking existing code
  resetTimetable: (classId?: string) => void;
  getClassTimetable: (classId: string) => TimetableEntry[];

  // Other actions
  setSubjects: (subjects: Subject[]) => void;
  setTeachers: (teachers: Teacher[]) => void;
  setClasses: (classes: Class[]) => void;
}

export const useTimetableStore = create<TimetableState>()((set, get) => ({
  // Initial state
  subjects: initialSubjects,
  teachers: initialTeachers,
  classes: initialClasses,
  activeClassId: initialClasses[0].id, // Default to first class
  days: DAYS,
  periodsPerDay: PERIODS.length,
  timetableEntries: [],

  // Class management
  addClass: (className) => {
    const newClass = { id: generateId(), name: className };
    set((state) => ({
      classes: [...state.classes, newClass],
    }));
  },

  removeClass: (classId) => {
    set((state) => ({
      classes: state.classes.filter((cls) => cls.id !== classId),
      // Also remove all timetable entries for this class
      timetableEntries: state.timetableEntries.filter(
        (entry) => entry.classId !== classId
      ),
      // If we're removing the active class, switch to another one
      activeClassId:
        state.activeClassId === classId && state.classes.length > 1
          ? state.classes.find((cls) => cls.id !== classId)?.id || ""
          : state.activeClassId,
    }));
  },

  setActiveClass: (classId) => {
    set({ activeClassId: classId });
  },

  // Timetable actions
  getClassTimetable: (classId) => {
    return get().timetableEntries.filter((entry) => entry.classId === classId);
  },

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
  },

  addTimetableEntry: (entry) => {
    const { activeClassId } = get();

    // Ensure the classId is set and valid
    const classId = entry.classId || activeClassId;

    if (!classId) {
      console.error("No class ID provided when adding timetable entry");
      return false;
    }

    const newEntry = {
      ...entry,
      id: generateId(),
      classId,
    };

    set((state) => ({
      timetableEntries: [...state.timetableEntries, newEntry],
    }));

    return true;
  },

  removeTimetableEntry: (id) => {
    set((state) => ({
      timetableEntries: state.timetableEntries.filter(
        (entry) => entry.id !== id
      ),
    }));
  },

  updateTimetableEntry: (id, updates) => {
    set((state) => ({
      timetableEntries: state.timetableEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    }));
  },

  moveTimetableEntry: (entryId, newDay, newPeriod) => {
    const { timetableEntries, teachers } = get();
    const entryToMove = timetableEntries.find((entry) => entry.id === entryId);

    if (!entryToMove) return false;

    // Check if the target slot is empty for the same class
    const isSlotEmpty = !timetableEntries.some(
      (entry) =>
        entry.id !== entryId &&
        entry.day === newDay &&
        entry.period === newPeriod &&
        entry.classId === entryToMove.classId
    );

    // Check if teacher is available for this slot
    const teacher = teachers.find((t) => t.id === entryToMove.teacherId);

    // Check if the teacher is already assigned to another class at the same time
    const isTeacherBusy = timetableEntries.some(
      (entry) =>
        entry.id !== entryId &&
        entry.day === newDay &&
        entry.period === newPeriod &&
        entry.teacherId === entryToMove.teacherId
    );

    const isTeacherAvailable =
      teacher?.availableSlots.some(
        (slot) => slot.day === newDay && slot.period === newPeriod
      ) && !isTeacherBusy;

    if (isSlotEmpty && isTeacherAvailable) {
      // Make a copy of the entry with updated values to ensure we preserve classId and other properties
      const updatedEntry = {
        ...entryToMove,
        day: newDay,
        period: newPeriod,
      };

      // Update the timetable entries array with the new entry
      set((state) => ({
        timetableEntries: state.timetableEntries.map((entry) =>
          entry.id === entryId ? updatedEntry : entry
        ),
      }));

      return true; // Return success
    }

    return false; // Return failure
  },

  // Empty validation function that does nothing
  validateTimetable: () => {
    // No-op function to maintain API compatibility
  },

  resetTimetable: (classId) => {
    set((state) => ({
      timetableEntries: classId
        ? state.timetableEntries.filter((entry) => entry.classId !== classId)
        : [],
    }));
  },

  setSubjects: (subjects) => {
    set({ subjects });
  },

  setTeachers: (teachers) => {
    set({ teachers });
  },

  setClasses: (classes) => {
    set({ classes });
  },
}));
