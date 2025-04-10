import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // State to track the currently dragged item for enhanced visual feedback
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<TimetableEntry | null>(
    null
  );

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
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the entry being dragged
    const draggedEntry = timetableEntries.find(
      (entry) => entry.id === active.id
    );
    if (draggedEntry) {
      setActiveDragData(draggedEntry);
    }

    // Add subtle sound effect
    playDragSound("start");
  };

  // Handle drag and drop completion
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDragData(null);

    // If no valid drop target or same position
    if (!over) {
      // Play cancel sound if dropped outside valid area
      playDragSound("cancel");
      return;
    }

    const entryId = active.id as string;

    // Extract day and period from droppable ID (format: "day-period")
    const droppableId = over.id as string;
    const [newDay, newPeriodStr] = droppableId.split("-");
    const newPeriod = parseInt(newPeriodStr, 10);

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
      if (!activeId) return true;

      // Find the entry we're dragging
      const entry = timetableEntries.find((e) => e.id === activeId);
      if (!entry) return true;

      // Check if the target slot already has an entry
      const hasExistingEntry = timetableEntries.some(
        (e) => e.day === day && e.period === period && e.id !== activeId
      );

      return !hasExistingEntry;
    },
    [activeId, timetableEntries]
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

  const Card = ({ entry }: { entry: TimetableEntry }) => {
    const { subject, teacher } = getEntryDetails(entry);

    if (!subject || !teacher) {
      return (
        <div
          className="p-3 rounded-lg border bg-muted shadow-sm"
          data-id={entry.id}
        >
          <div className="text-xs">Missing data</div>
        </div>
      );
    }

    const colorClasses = getSubjectColor(subject.id);
    const isDragging = activeId === entry.id;

    return (
      <div
        className={`p-2 sm:p-3 rounded-lg border cursor-grab active:cursor-grabbing ${
          isDragging ? "shadow-md opacity-90" : "shadow-sm hover:shadow-md"
        } ${colorClasses} transition-all duration-200`}
        data-id={entry.id}
      >
        <div className="w-full h-full">
          <div className="font-semibold text-sm">{subject.name}</div>
          <div className="text-xs mt-1 opacity-80">{teacher.name}</div>
        </div>
      </div>
    );
  };

  // Droppable area component
  const DroppableCell = ({
    day,
    period,
    children,
  }: {
    day: string;
    period: number;
    children: React.ReactNode;
  }) => {
    const isHighlighted = isSlotHighlighted(day, period);
    const isValidTarget = isValidDropTarget(day, period);
    const droppableId = `${day}-${period}`;

    const { isOver, setNodeRef } = useDroppable({
      id: droppableId,
      disabled: !isValidTarget,
    });

    // Simplified styling with minimal transitions
    return (
      <div
        ref={setNodeRef}
        className={`h-full w-full rounded-lg relative ${
          isOver && isValidTarget
            ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700"
            : isOver && !isValidTarget
            ? "bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700"
            : "border border-transparent"
        }`}
      >
        {children}

        {/* Simpler drop indicator for empty cells */}
        {!children && isOver && isValidTarget && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30"></div>
          </div>
        )}
      </div>
    );
  };

  // Draggable item component
  const DraggableItem = ({ entry }: { entry: TimetableEntry }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: entry.id,
        data: entry,
      });

    // Simpler transform with no rotation or scaling
    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={isDragging ? "z-10" : ""}
      >
        <Card entry={entry} />
      </div>
    );
  };

  return (
    <div className="w-full mb-8">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
                        <DroppableCell day={day} period={period}>
                          {entry && <DraggableItem entry={entry} />}
                        </DroppableCell>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Simpler drag overlay with no rotation */}
        <DragOverlay adjustScale={false}>
          {activeDragData && <Card entry={activeDragData} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default TimetableGrid;
