import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimetableStore } from "../../store";
import { ValidationError } from "../../types";
import { ERROR_SEVERITY } from "../../constants";

const ValidationMessages = () => {
  const { validationErrors, validateTimetable } = useTimetableStore();

  // Revalidate whenever the component mounts
  useEffect(() => {
    validateTimetable();
  }, [validateTimetable]);

  if (validationErrors.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-4 sm:mb-6 flex items-center shadow-sm"
      >
        <div className="h-7 w-7 sm:h-8 sm:w-8 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-sm sm:text-base text-green-700 dark:text-green-400 font-medium">
          Timetable is valid! No validation issues found.
        </p>
      </motion.div>
    );
  }

  // Separate errors by severity
  const errors = validationErrors.filter(
    (error) => error.severity === ERROR_SEVERITY.ERROR
  );
  const warnings = validationErrors.filter(
    (error) => error.severity === ERROR_SEVERITY.WARNING
  );

  return (
    <div className="mb-4 sm:mb-8 w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold">
          Validation Issues
        </h2>
        <motion.span
          className="text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full font-medium"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          {validationErrors.length}{" "}
          {validationErrors.length === 1 ? "issue" : "issues"} found
        </motion.span>
      </div>

      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            <div className="flex items-center mb-2">
              <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 dark:text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
                Errors ({errors.length})
              </h3>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden shadow-sm">
              {errors.map((error, index) => (
                <ErrorMessage key={error.id} error={error} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3"
          >
            <div className="flex items-center mb-2">
              <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 dark:text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Warnings ({warnings.length})
              </h3>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden shadow-sm">
              {warnings.map((error, index) => (
                <ErrorMessage key={error.id} error={error} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ErrorMessage = ({
  error,
  index,
}: {
  error: ValidationError;
  index: number;
}) => {
  const isError = error.severity === ERROR_SEVERITY.ERROR;

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 5 }}
      transition={{ delay: index * 0.05 }}
      className={`p-2 sm:p-3 border-b last:border-b-0 hover:bg-opacity-70 transition-colors ${
        isError
          ? "border-red-200 dark:border-red-800"
          : "border-amber-200 dark:border-amber-800"
      }`}
    >
      <div className="flex">
        <div className="mr-2 sm:mr-3 mt-0.5">
          {isError ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 dark:text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 dark:text-amber-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 102 0v-2a1 1 0 00-2 0v2z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <p
          className={`text-xs sm:text-sm ${
            isError
              ? "text-red-700 dark:text-red-400"
              : "text-amber-700 dark:text-amber-400"
          }`}
        >
          {error.message}
        </p>
      </div>
    </motion.div>
  );
};

export default ValidationMessages;
