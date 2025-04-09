import { Draggable } from "react-beautiful-dnd";
import { motion } from "framer-motion";
import { Subject, Teacher } from "../../types";

interface SubjectCardProps {
  subject: Subject;
  teacher: Teacher;
  draggableId: string;
  index: number;
}

// Get subject color based on subject id
const getSubjectColor = (subjectId: number) => {
  const colors = [
    "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-100",
    "bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-800 dark:text-green-100",
    "bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-100",
    "bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100",
    "bg-pink-100 dark:bg-pink-900/50 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-100",
    "bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-100",
    "bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-800 dark:text-red-100",
    "bg-teal-100 dark:bg-teal-900/50 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-100",
  ];
  return colors[subjectId % colors.length];
};

const SubjectCard = ({
  subject,
  teacher,
  draggableId,
  index,
}: SubjectCardProps) => {
  const colorClasses = getSubjectColor(subject.id);

  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 rounded-lg shadow-sm mb-3 border ${colorClasses} ${
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-offset-1"
              : "hover:shadow-md transition-shadow duration-200"
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: index * 0.05,
            }}
            className="w-full"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-foreground">{subject.name}</h3>
              <div className="bg-white bg-opacity-50 dark:bg-black dark:bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">
                {subject.weeklyLectures}h
              </div>
            </div>

            <div className="mt-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1 opacity-70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm opacity-80">{teacher.name}</span>
            </div>

            <div className="mt-2 flex justify-between text-xs">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Weekly: {subject.weeklyLectures}</span>
              </div>

              <motion.div
                className="text-xs cursor-help bg-white bg-opacity-60 dark:bg-black dark:bg-opacity-20 px-1.5 py-0.5 rounded-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {teacher.availableSlots.length} available slots
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
};

export default SubjectCard;
