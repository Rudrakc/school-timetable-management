import { useMemo } from "react";
import { useTimetableStore } from "../store/timetableStore";
import { Subject, Teacher, TimetableEntry, TimeSlot } from "../types";

/**
 * Custom hook for timetable operations and derived data
 */
export const useTimetable = () => {
  const {
    subjects,
    teachers,
    days,
    periodsPerDay,
    timetableEntries,
    validationErrors,
    addTimetableEntry,
    removeTimetableEntry,
    updateTimetableEntry,
    moveTimetableEntry,
    initializeTimetable,
    resetTimetable,
  } = useTimetableStore();

  // Get all time slots in the timetable
  const allTimeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    days.forEach((day) => {
      for (let period = 1; period <= periodsPerDay; period++) {
        slots.push({ day, period });
      }
    });
    return slots;
  }, [days, periodsPerDay]);

  // Get timetable entry for a specific slot
  const getEntryForSlot = (
    day: string,
    period: number
  ): TimetableEntry | undefined => {
    return timetableEntries.find(
      (entry) => entry.day === day && entry.period === period
    );
  };

  // Check if a teacher is available for a specific slot
  const isTeacherAvailable = (
    teacherId: number,
    day: string,
    period: number
  ): boolean => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return false;

    return teacher.availableSlots.some(
      (slot) => slot.day === day && slot.period === period
    );
  };

  // Get all entries for a specific teacher
  const getEntriesForTeacher = (teacherId: number): TimetableEntry[] => {
    return timetableEntries.filter((entry) => entry.teacherId === teacherId);
  };

  // Get all entries for a specific subject
  const getEntriesForSubject = (subjectId: number): TimetableEntry[] => {
    return timetableEntries.filter((entry) => entry.subjectId === subjectId);
  };

  // Get subject by ID
  const getSubjectById = (subjectId: number): Subject | undefined => {
    return subjects.find((subject) => subject.id === subjectId);
  };

  // Get teacher by ID
  const getTeacherById = (teacherId: number): Teacher | undefined => {
    return teachers.find((teacher) => teacher.id === teacherId);
  };

  // Check if a slot is occupied
  const isSlotOccupied = (day: string, period: number): boolean => {
    return timetableEntries.some(
      (entry) => entry.day === day && entry.period === period
    );
  };

  // Get validation errors related to a specific entry
  const getErrorsForEntry = (entryId: string) => {
    // For now, we'll just return all errors
    // In future, we can filter errors related to specific entries
    return validationErrors;
  };

  // Check if timetable is valid (no errors)
  const isTimetableValid = (): boolean => {
    return validationErrors.length === 0;
  };

  return {
    // State
    subjects,
    teachers,
    days,
    periodsPerDay,
    timetableEntries,
    validationErrors,

    // Actions
    initializeTimetable,
    resetTimetable,
    addTimetableEntry,
    removeTimetableEntry,
    updateTimetableEntry,
    moveTimetableEntry,

    // Derived data and helpers
    allTimeSlots,
    getEntryForSlot,
    isTeacherAvailable,
    getEntriesForTeacher,
    getEntriesForSubject,
    getSubjectById,
    getTeacherById,
    isSlotOccupied,
    getErrorsForEntry,
    isTimetableValid,
  };
};
