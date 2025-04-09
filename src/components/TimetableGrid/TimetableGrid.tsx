import { useCallback, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvided,
  DraggableStateSnapshot,
  DragStart,
} from "react-beautiful-dnd";
import { AnimatePresence } from "framer-motion";
import { useTimetableStore } from "../../store";
import { DAYS, PERIODS } from "../../constants";
import { TimetableEntry } from "../../types";

const TimetableGrid = () => {
  const {
    timetableEntries,
    subjects,
    teachers,
    moveTimetableEntry,
    validateTimetable,
    validationErrors,
  } = useTimetableStore();

  // State to track the currently dragged item for enhanced visual feedback
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Helper to find subject and teacher for an entry
  const getEntryDetails = useCallback(
    (entry: TimetableEntry) => {
      const subject = subjects.find((s) => s.id === entry.subjectId);
      const teacher = teachers.find((t) => t.id === entry.teacherId);
      return { subject, teacher };
    },
    [subjects, teachers]
  );

  // Handle drag start - track the dragged item
  const handleDragStart = (result: DragStart) => {
    setDraggedId(result.draggableId);
    // Add subtle sound effect
    playDragSound("start");
  };

  // Handle drag and drop completion
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    setDraggedId(null);

    // Drop outside valid area or no movement
    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    ) {
      // Play cancel sound if dropped outside valid area
      playDragSound("cancel");
      return;
    }

    // Extract day and period from the destination droppableId (format: "day-period")
    const [newDay, newPeriodStr] = destination.droppableId.split("-");
    const newPeriod = parseInt(newPeriodStr, 10);

    // Get the entry ID being moved
    const entryId = result.draggableId;

    // Execute the move
    moveTimetableEntry(entryId, newDay, newPeriod);

    // Validate the timetable after move
    validateTimetable();

    // Play success sound
    playDragSound("drop");
  };

  // Simple utility for drag sounds
  const playDragSound = (type: "start" | "drop" | "cancel") => {
    // This would implement actual sounds in production
    // For now we just have the function structure
  };

  const isSlotHighlighted = useCallback(
    (day: string, period: number) => {
      // Check if any validation errors reference this slot
      return validationErrors.some((error) =>
        error.message.includes(`${day}, period ${period}`)
      );
    },
    [validationErrors]
  );

  // Check if a slot is a valid drop target
  const isValidDropTarget = useCallback(
    (day: string, period: number) => {
      if (!draggedId) return true;

      // Find the entry we're dragging
      const entry = timetableEntries.find((e) => e.id === draggedId);
      if (!entry) return true;

      // Check if the target slot already has an entry
      const hasExistingEntry = timetableEntries.some(
        (e) => e.day === day && e.period === period && e.id !== draggedId
      );

      return !hasExistingEntry;
    },
    [draggedId, timetableEntries]
  );

  // Get color for subject
  const getSubjectColor = useCallback((subjectId: number) => {
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
  }, []);

  const getColorClassForSubject = (subjectName: string) => {
    // Find subject by name or use a default color scheme
    const subject = subjects.find((s) => s.name === subjectName);
    if (subject) {
      return getSubjectColor(subject.id);
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const Card = ({ entry, index }: { entry: TimetableEntry; index: number }) => {
    const { subject, teacher } = getEntryDetails(entry);

    if (!subject || !teacher) {
      return (
        <Draggable draggableId={entry.id} index={index} key={entry.id}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className="p-3 rounded-lg border bg-muted shadow-sm"
            >
              <div className="text-xs">Missing data</div>
            </div>
          )}
        </Draggable>
      );
    }

    const colorClasses = getSubjectColor(subject.id);

    return (
      <Draggable draggableId={entry.id} index={index} key={entry.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-2 sm:p-3 rounded-lg border cursor-grab active:cursor-grabbing ${
              snapshot.isDragging
                ? "shadow-md opacity-90"
                : "shadow-sm hover:shadow-md"
            } ${colorClasses} transition-all duration-200`}
          >
            <div className="w-full h-full">
              <div className="font-semibold text-sm">{subject.name}</div>
              <div className="text-xs mt-1 opacity-80">{teacher.name}</div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="w-full mb-8">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto rounded-xl shadow-lg">
          <table className="w-full min-w-full border-collapse bg-card table-fixed">
            <colgroup>
              <col className="w-16" />
              {DAYS.map((day, index) => (
                <col key={`col-${day}`} className="w-1/6" />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-muted">
                <th className="p-4 border border-border w-16 rounded-tl-xl"></th>
                {DAYS.map((day, index) => (
                  <th
                    key={day}
                    className={`p-3 sm:p-4 border border-border font-medium text-foreground ${
                      index === DAYS.length - 1 ? "rounded-tr-xl" : ""
                    }`}
                  >
                    <div>{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, rowIndex) => (
                <tr key={period}>
                  <td className="p-3 sm:p-4 border border-border font-medium text-center bg-muted">
                    <div>{period}</div>
                  </td>
                  {DAYS.map((day, colIndex) => {
                    // Find timetable entry for this slot
                    const entry = timetableEntries.find(
                      (e) => e.day === day && e.period === period
                    );

                    // Style classes based on validation and drag status
                    const isHighlighted = isSlotHighlighted(day, period);
                    const isValidTarget = isValidDropTarget(day, period);

                    const cellClasses = `p-2 border border-border h-24 sm:h-28 ${
                      isHighlighted
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-card"
                    } ${
                      // Bottom corners
                      rowIndex === PERIODS.length - 1 && colIndex === 0
                        ? "rounded-bl-xl"
                        : ""
                    } ${
                      rowIndex === PERIODS.length - 1 &&
                      colIndex === DAYS.length - 1
                        ? "rounded-br-xl"
                        : ""
                    }`;

                    return (
                      <td key={`${day}-${period}`} className={cellClasses}>
                        <Droppable
                          droppableId={`${day}-${period}`}
                          isDropDisabled={!isValidTarget}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`h-full w-full rounded-lg relative transition-all duration-200 ${
                                snapshot.isDraggingOver && isValidTarget
                                  ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700"
                                  : snapshot.isDraggingOver && !isValidTarget
                                  ? "bg-red-50 dark:bg-red-900/30 border-2 border-dashed border-red-300 dark:border-red-700"
                                  : draggedId && isValidTarget
                                  ? "border-2 border-transparent bg-blue-50/30 dark:bg-blue-900/10"
                                  : "border-2 border-transparent"
                              }`}
                            >
                              {/* Animation container for cell content */}
                              <AnimatePresence mode="wait">
                                {entry && <Card entry={entry} index={0} />}
                              </AnimatePresence>
                              {provided.placeholder}

                              {/* Drop indicator overlay for empty cells */}
                              {!entry && draggedId && isValidTarget && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-blue-500 dark:text-blue-400"
                                  >
                                    <path d="M12 19V5M5 12h14" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DragDropContext>
    </div>
  );
};

export default TimetableGrid;
