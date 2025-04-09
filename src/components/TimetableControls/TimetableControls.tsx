import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTimetableStore } from "../../store";
import { Button } from "../ui/button";

const TimetableControls = () => {
  const {
    initializeTimetable,
    resetTimetable,
    timetableEntries,
    subjects,
    teachers,
    validationErrors,
  } = useTimetableStore();

  // Calculate statistics
  const statistics = useMemo(() => {
    // Count of entries per subject
    const entriesPerSubject: Record<number, number> = {};
    subjects.forEach((subject) => {
      entriesPerSubject[subject.id] = timetableEntries.filter(
        (entry) => entry.subjectId === subject.id
      ).length;
    });

    // Count of entries per teacher
    const entriesPerTeacher: Record<number, number> = {};
    teachers.forEach((teacher) => {
      entriesPerTeacher[teacher.id] = timetableEntries.filter(
        (entry) => entry.teacherId === teacher.id
      ).length;
    });

    // Count entries per day
    const entriesPerDay: Record<string, number> = {};
    timetableEntries.forEach((entry) => {
      entriesPerDay[entry.day] = (entriesPerDay[entry.day] || 0) + 1;
    });

    // Calculate completeness percentage
    const totalRequiredEntries = subjects.reduce(
      (sum, subject) => sum + subject.weeklyLectures,
      0
    );
    const completenessPercentage =
      totalRequiredEntries > 0
        ? Math.round((timetableEntries.length / totalRequiredEntries) * 100)
        : 0;

    // Calculate difference between required and actual entries per subject
    const subjectCompleteness = subjects.map((subject) => {
      const required = subject.weeklyLectures;
      const actual = entriesPerSubject[subject.id] || 0;
      return {
        id: subject.id,
        name: subject.name,
        required,
        actual,
        percentage: required > 0 ? Math.round((actual / required) * 100) : 0,
      };
    });

    return {
      totalEntries: timetableEntries.length,
      entriesPerSubject,
      entriesPerTeacher,
      entriesPerDay,
      completenessPercentage,
      totalSubjects: subjects.length,
      totalTeachers: teachers.length,
      subjectCompleteness,
    };
  }, [timetableEntries, subjects, teachers]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Timetable Dashboard</h2>
        <div className="flex w-full sm:w-auto gap-3 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            onClick={resetTimetable}
            className="border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm w-full sm:w-auto"
          >
            Reset Timetable
          </Button>
          <Button
            onClick={initializeTimetable}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-sm w-full sm:w-auto"
          >
            Generate New Timetable
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full mb-4 sm:mb-6">
        <motion.div
          className="bg-card rounded-lg p-3 sm:p-4 shadow-sm border border-border w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">
            Completeness
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2">
            {statistics.completenessPercentage}%
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${statistics.completenessPercentage}%` }}
            ></div>
          </div>
        </motion.div>

        <motion.div
          className="bg-card rounded-lg p-3 sm:p-4 shadow-sm border border-border w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">
            Total Entries
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2">
            {statistics.totalEntries}
          </div>
          <div className="text-xs text-muted-foreground">
            From {statistics.totalSubjects} subjects and{" "}
            {statistics.totalTeachers} teachers
          </div>
        </motion.div>

        <motion.div
          className="bg-card rounded-lg p-3 sm:p-4 shadow-sm border border-border w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">
            Issues
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2">
            <span
              className={
                validationErrors.length > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }
            >
              {validationErrors.length}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {validationErrors.length === 0
              ? "No validation issues found!"
              : `${validationErrors.length} issues need attention`}
          </div>
        </motion.div>

        <motion.div
          className="bg-card rounded-lg p-3 sm:p-4 shadow-sm border border-border w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">
            Subject Coverage
          </div>
          <div className="mt-2 space-y-2">
            {statistics.subjectCompleteness
              .sort((a, b) => a.percentage - b.percentage)
              .slice(0, 3)
              .map((subject) => (
                <div key={subject.id} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{subject.name}</span>
                    <span className="text-muted-foreground">
                      {subject.actual}/{subject.required}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        subject.percentage < 100
                          ? "bg-amber-500 dark:bg-amber-600"
                          : subject.percentage > 100
                          ? "bg-red-500 dark:bg-red-600"
                          : "bg-green-500 dark:bg-green-600"
                      }`}
                      style={{ width: `${Math.min(100, subject.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TimetableControls;
