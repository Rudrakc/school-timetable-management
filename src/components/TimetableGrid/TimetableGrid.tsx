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
import { useTimetableStore } from "../../store";
import { DAYS, PERIODS } from "../../constants";
import { TimetableEntry } from "../../types";
import EditTimetableEntryDialog from "./EditTimetableEntryDialog";
import { CirclePlus, Grip } from "lucide-react";
import { toast } from "sonner";

const TimetableGrid = () => {
  const {
    timetableEntries,
    subjects,
    teachers,
    moveTimetableEntry,
    validateTimetable,
  } = useTimetableStore();

  // Configure sensors for drag detection with delay to distinguish between drag and click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // This delay helps distinguish between a click and a drag
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // State to track the currently dragged item for enhanced visual feedback
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<TimetableEntry | null>(
    null
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<
    TimetableEntry | undefined
  >(undefined);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>(
    undefined
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

  // Open dialog for editing an entry
  const openEditDialog = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setSelectedDay(undefined);
    setSelectedPeriod(undefined);
    setDialogOpen(true);
  };

  // Open dialog for adding a new entry
  const openAddDialog = (day: string, period: number) => {
    setSelectedEntry(undefined);
    setSelectedDay(day);
    setSelectedPeriod(period);
    setDialogOpen(true);
  };

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
  };

  // Handle drag and drop completion
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDragData(null);

    // If no valid drop target or same position
    if (!over) {
      return;
    }

    const entryId = active.id as string;

    // Extract day and period from droppable ID (format: "day-period")
    const droppableId = over.id as string;
    const [newDay, newPeriodStr] = droppableId.split("-");
    const newPeriod = parseInt(newPeriodStr, 10);

    // Find the entry we're moving
    const entryToMove = timetableEntries.find((entry) => entry.id === entryId);
    if (!entryToMove) return;

    // Check if the target slot is empty
    const isSlotEmpty = !timetableEntries.some(
      (entry) =>
        entry.id !== entryId &&
        entry.day === newDay &&
        entry.period === newPeriod
    );

    if (!isSlotEmpty) {
      toast.error("This slot is already occupied");
      return;
    }

    // Check teacher availability
    const teacher = teachers.find((t) => t.id === entryToMove.teacherId);
    const isTeacherAvailable = teacher?.availableSlots.some(
      (slot) => slot.day === newDay && slot.period === newPeriod
    );

    if (!isTeacherAvailable) {
      // Simplified error toast
      const teacherName = teacher?.name || "Selected teacher";
      toast.error(`${teacherName} is not available for this slot.`);
      return;
    }

    // Execute the move
    moveTimetableEntry(entryId, newDay, newPeriod);

    // Show success toast
    const movedSubject = subjects.find((s) => s.id === entryToMove.subjectId);
    const movedTeacher = teachers.find((t) => t.id === entryToMove.teacherId);
    toast.success(
      <div>
        <p>
          Successfully moved <strong>{movedSubject?.name}</strong>
        </p>
        <p className="text-xs opacity-80">Teacher: {movedTeacher?.name}</p>
      </div>
    );

    // Validate the timetable after move
    validateTimetable();
  };

  // Get color for subject
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

  const Card = ({ entry }: { entry: TimetableEntry }) => {
    const { subject, teacher } = getEntryDetails(entry);

    if (!subject || !teacher) {
      return (
        <div
          className="p-3 rounded-lg border bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 shadow-sm"
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
        onClick={() => openEditDialog(entry)}
        className={`p-2 sm:p-3 rounded-lg border cursor-pointer ${
          isDragging
            ? "shadow-md opacity-95 ring-2 ring-blue-400/50 dark:ring-blue-600/50"
            : "shadow-sm hover:shadow-md hover:brightness-105"
        } ${colorClasses} transition-all duration-200`}
        data-id={entry.id}
      >
        <div className="w-full h-full">
          <div className="font-semibold text-sm">{subject.name}</div>
          <div className="text-xs mt-1 opacity-90">{teacher.name}</div>
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
    // Always allow drop, but check if teacher is available for visual feedback
    const droppableId = `${day}-${period}`;

    const { isOver, setNodeRef } = useDroppable({
      id: droppableId,
      // We no longer disable dropping based on teacher availability
    });

    // Check if teacher is available for this slot (for visual indication only)
    const isTeacherAvailable = () => {
      if (!activeId) return true;

      const entry = timetableEntries.find((e) => e.id === activeId);
      if (!entry) return true;

      const teacher = teachers.find((t) => t.id === entry.teacherId);
      return teacher?.availableSlots.some(
        (slot) => slot.day === day && slot.period === period
      );
    };

    // Check if slot is empty
    const isSlotEmpty = !children;
    const canDrop = isSlotEmpty;
    const teacherAvailable = isTeacherAvailable();

    // Handle click on empty cell to add new entry
    const handleCellClick = () => {
      if (!children) {
        openAddDialog(day, period);
      }
    };

    return (
      <div
        ref={setNodeRef}
        onClick={handleCellClick}
        className={`h-full w-full rounded-lg relative transition-colors duration-150 ${
          isOver && canDrop && teacherAvailable
            ? "bg-blue-50/70 dark:bg-blue-900/30 border-2 border-blue-300/80 dark:border-blue-600"
            : isOver && canDrop && !teacherAvailable
            ? "bg-yellow-50/70 dark:bg-yellow-900/30 border-2 border-yellow-300/80 dark:border-yellow-600"
            : isOver && !canDrop
            ? "bg-red-50/70 dark:bg-red-900/30 border-2 border-red-300/80 dark:border-red-600"
            : !children
            ? "border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
            : "border border-transparent"
        } ${
          !children
            ? "cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/30"
            : ""
        }`}
      >
        {children}

        {/* Drop indicator for empty cells */}
        {!children && isOver && canDrop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full ${
                  teacherAvailable
                    ? "bg-blue-100 dark:bg-blue-800/40"
                    : "bg-yellow-100 dark:bg-yellow-800/40"
                } flex items-center justify-center`}
              >
                <CirclePlus
                  className={`w-7 h-7 ${
                    teacherAvailable
                      ? "text-blue-600 dark:text-blue-300"
                      : "text-yellow-600 dark:text-yellow-300"
                  }`}
                />
              </div>
              <div
                className={`text-xs mt-2 ${
                  teacherAvailable
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-yellow-700 dark:text-yellow-300"
                } font-medium`}
              >
                {teacherAvailable ? "Drop here" : "Teacher unavailable"}
              </div>
            </div>
          </div>
        )}

        {/* Plus icon for empty cells */}
        {!children && !isOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-70 opacity-40 transition-opacity">
            <CirclePlus className="w-6 h-6 text-gray-400 dark:opacity-30" />
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

    // Transform with subtle scale effect
    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          zIndex: isDragging ? 10 : "auto",
        }
      : undefined;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative ${isDragging ? "z-10" : ""}`}
      >
        <div
          className="absolute -top-1 -right-1 z-20 w-6 h-6 cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 shadow-sm rounded-md flex items-center justify-center transition-colors border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          {...listeners}
          {...attributes}
        >
          <Grip className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </div>
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
          <table className="w-full min-w-full border-collapse bg-white dark:bg-card table-fixed">
            <colgroup>
              <col className="w-16" />
              {DAYS.map((day) => (
                <col key={`col-${day}`} className="w-1/6" />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 dark:bg-muted">
                <th className="p-4 border border-gray-200 dark:border-border w-16 rounded-tl-xl"></th>
                {DAYS.map((day, index) => (
                  <th
                    key={day}
                    className={`p-3 sm:p-4 border border-gray-200 dark:border-border font-medium text-gray-700 dark:text-foreground ${
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
                  <td className="p-3 sm:p-4 border border-gray-200 dark:border-border font-medium text-center bg-gray-50 dark:bg-muted text-gray-700 dark:text-gray-300">
                    <div>{period}</div>
                  </td>
                  {DAYS.map((day, colIndex) => {
                    // Find timetable entry for this slot
                    const entry = timetableEntries.find(
                      (e) => e.day === day && e.period === period
                    );

                    const cellClasses = `p-2 border border-gray-200 dark:border-border h-24 sm:h-28 bg-white dark:bg-card ${
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
      </DndContext>

      {/* Edit dialog */}
      <EditTimetableEntryDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        entry={selectedEntry}
        day={selectedDay}
        period={selectedPeriod}
      />
    </div>
  );
};

export default TimetableGrid;
