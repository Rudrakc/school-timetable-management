import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTimetableStore } from "../../store";
import { Button } from "../ui/button";

const TimetableControls = () => {
  const {
    resetTimetable,
    timetableEntries,
    subjects,
    teachers,
    classes,
    activeClassId,
    setActiveClass,
    getClassTimetable,
  } = useTimetableStore();

  // Get entries for the active class
  const activeClassEntries = useMemo(() => {
    return getClassTimetable(activeClassId);
  }, [activeClassId, getClassTimetable]);

  // Calculate statistics
  const statistics = useMemo(() => {
    // Count of entries per subject
    const entriesPerSubject: Record<number, number> = {};
    subjects.forEach((subject) => {
      entriesPerSubject[subject.id] = activeClassEntries.filter(
        (entry) => entry.subjectId === subject.id
      ).length;
    });

    // Count of entries per teacher
    const entriesPerTeacher: Record<number, number> = {};
    teachers.forEach((teacher) => {
      entriesPerTeacher[teacher.id] = activeClassEntries.filter(
        (entry) => entry.teacherId === teacher.id
      ).length;
    });

    // Count entries per day
    const entriesPerDay: Record<string, number> = {};
    activeClassEntries.forEach((entry) => {
      entriesPerDay[entry.day] = (entriesPerDay[entry.day] || 0) + 1;
    });

    // Calculate completeness percentage
    const totalRequiredEntries = subjects.reduce(
      (sum, subject) => sum + subject.weeklyLectures,
      0
    );
    const completenessPercentage =
      totalRequiredEntries > 0
        ? Math.round((activeClassEntries.length / totalRequiredEntries) * 100)
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
      totalEntries: activeClassEntries.length,
      entriesPerSubject,
      entriesPerTeacher,
      entriesPerDay,
      completenessPercentage,
      totalSubjects: subjects.length,
      totalTeachers: teachers.length,
      subjectCompleteness,
    };
  }, [activeClassEntries, subjects, teachers]);

  // Get the active class name
  const activeClassName = useMemo(() => {
    const activeClass = classes.find((cls) => cls.id === activeClassId);
    return activeClass ? activeClass.name : "";
  }, [activeClassId, classes]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Timetable Dashboard - {activeClassName}
        </h2>
        <div className="flex w-full sm:w-auto gap-3 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            onClick={() => resetTimetable(activeClassId)}
            className="border-red-200 dark:border-red-800 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm w-full sm:w-auto shadow-sm"
          >
            Reset {activeClassName} Timetable
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full mb-4 sm:mb-6">
        <motion.div
          className="bg-white dark:bg-card rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            Completeness
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            {statistics.completenessPercentage}%
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${statistics.completenessPercentage}%` }}
            ></div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-card rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Entries
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            {statistics.totalEntries}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            From {statistics.totalSubjects} subjects and{" "}
            {statistics.totalTeachers} teachers
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-card rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-800 w-full flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            Class Selection
          </div>
          <div className="flex flex-col gap-3">
            {classes.map((cls) => (
              <Button
                key={cls.id}
                variant={activeClassId === cls.id ? "default" : "outline"}
                className={`w-full h-12 text-lg font-medium ${
                  activeClassId === cls.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-[#f9fafb]"
                }`}
                onClick={() => setActiveClass(cls.id)}
              >
                {cls.name}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TimetableControls;
