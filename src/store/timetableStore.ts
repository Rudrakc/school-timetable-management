import { create } from "zustand";
import { Subject, Teacher, TimetableEntry, TimeSlot } from "../types";
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
  days: string[];
  periodsPerDay: number;
  timetableEntries: TimetableEntry[];

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
  validateTimetable: () => void; // Keep as no-op to avoid breaking existing code
  resetTimetable: () => void;
  setSubjects: (subjects: Subject[]) => void;
  setTeachers: (teachers: Teacher[]) => void;
}

export const useTimetableStore = create<TimetableState>()((set, get) => ({
  // Initial state
  subjects: initialSubjects,
  teachers: initialTeachers,
  days: DAYS,
  periodsPerDay: PERIODS.length,
  timetableEntries: [],

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
    const newEntry = { ...entry, id: generateId() };
    set((state) => ({
      timetableEntries: [...state.timetableEntries, newEntry],
    }));
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
    }
  },

  // Empty validation function that does nothing
  validateTimetable: () => {
    // No-op function to maintain API compatibility
  },

  resetTimetable: () => {
    set({ timetableEntries: [] });
  },

  setSubjects: (subjects) => {
    set({ subjects });
  },

  setTeachers: (teachers) => {
    set({ teachers });
  },
}));
