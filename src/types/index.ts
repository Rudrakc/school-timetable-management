export interface Subject {
  id: number;
  name: string;
  weeklyLectures: number;
}

export interface Teacher {
  id: number;
  name: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  day: string;
  period: number;
}

export interface TimetableEntry {
  id: string;
  subjectId: number;
  teacherId: number;
  day: string;
  period: number;
  classId: string;
}

export interface Class {
  id: string;
  name: string;
}
