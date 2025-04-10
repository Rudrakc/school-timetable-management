import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import { useTimetableStore } from "../../store";
import { TimetableEntry } from "../../types";
import { toast } from "sonner";

interface EditTimetableEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: TimetableEntry;
  day?: string;
  period?: number;
}

const EditTimetableEntryDialog = ({
  isOpen,
  onClose,
  entry,
  day,
  period,
}: EditTimetableEntryDialogProps) => {
  const {
    subjects,
    teachers,
    addTimetableEntry,
    updateTimetableEntry,
    removeTimetableEntry,
    validateTimetable,
  } = useTimetableStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null
  );
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);

  const isNewEntry = !entry;

  // Get subject and teacher names for display
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  // Set initial values when dialog opens
  useEffect(() => {
    if (entry) {
      setSelectedSubjectId(entry.subjectId);
      setSelectedTeacherId(entry.teacherId);
    } else {
      // Default values for new entry
      setSelectedSubjectId(subjects[0]?.id || null);
      setSelectedTeacherId(teachers[0]?.id || null);
    }
  }, [entry, subjects, teachers]);

  const handleSave = () => {
    if (!selectedSubjectId || !selectedTeacherId) {
      return; // Can't save without both values
    }

    if (isNewEntry) {
      // Creating a new entry
      if (day && period !== undefined) {
        // Check if the teacher is available for this slot
        const teacher = teachers.find((t) => t.id === selectedTeacherId);
        if (teacher) {
          // Check if this specific slot is available
          const isSlotAvailable = teacher.availableSlots.some(
            (slot) => slot.day === day && slot.period === period
          );

          if (!isSlotAvailable) {
            // Simplified error toast
            toast.error(`${teacher.name} is not available for this slot.`);
            return; // Don't save the entry
          }
        }

        addTimetableEntry({
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          day,
          period,
        });

        toast.success(
          <div>
            <p>
              Successfully added <strong>{selectedSubject?.name}</strong>
            </p>
            <p className="text-xs opacity-80">
              Teacher: {selectedTeacher?.name}
            </p>
          </div>
        );
      }
    } else if (entry) {
      // Updating existing entry
      updateTimetableEntry(entry.id, {
        subjectId: selectedSubjectId,
        teacherId: selectedTeacherId,
      });

      toast.success(
        <div>
          <p>Successfully updated entry</p>
        </div>
      );
    }

    validateTimetable();
    onClose();
  };

  const handleDelete = () => {
    if (entry) {
      removeTimetableEntry(entry.id);
      validateTimetable();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-card border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {isNewEntry ? "Add New Entry" : "Edit Timetable Entry"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {isNewEntry
              ? `Adding entry for ${day}, Period ${period}`
              : `Editing entry for ${entry?.day}, Period ${entry?.period}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="subject"
              className="text-right text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Subject
            </label>
            <div className="col-span-3">
              <DropdownMenu open={subjectOpen} onOpenChange={setSubjectOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-white dark:bg-transparent border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                    id="subject"
                  >
                    {selectedSubject?.name || "Select a subject"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-full min-w-[240px] bg-white dark:bg-card border-gray-200 dark:border-gray-800"
                  align="start"
                >
                  {subjects.map((subject) => (
                    <DropdownMenuItem
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubjectId(subject.id);
                        setSubjectOpen(false);
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {subject.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="teacher"
              className="text-right text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Teacher
            </label>
            <div className="col-span-3">
              <DropdownMenu open={teacherOpen} onOpenChange={setTeacherOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-white dark:bg-transparent border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                    id="teacher"
                  >
                    {selectedTeacher?.name || "Select a teacher"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-full min-w-[240px] bg-white dark:bg-card border-gray-200 dark:border-gray-800"
                  align="start"
                >
                  {teachers.map((teacher) => (
                    <DropdownMenuItem
                      key={teacher.id}
                      onClick={() => {
                        setSelectedTeacherId(teacher.id);
                        setTeacherOpen(false);
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {teacher.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <DialogFooter>
          {!isNewEntry && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 dark:border-gray-700"
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTimetableEntryDialog;
