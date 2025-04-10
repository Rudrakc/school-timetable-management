import { useEffect } from "react";
import TimetableGrid from "./components/TimetableGrid";
import TimetableControls from "./components/TimetableControls";
import { ModeToggle } from "./components/mode-toggle";
import { ThemeProvider } from "./components/theme-provider";
import { useTimetableStore } from "./store";
import { Toaster } from "./components/ui/sonner";
import "./App.css";

function App() {
  const { initializeTimetable } = useTimetableStore();

  // Initialize timetable when app loads
  useEffect(() => {
    initializeTimetable();
  }, [initializeTimetable]);

  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col py-6 transition-colors duration-200">
        <div className="container w-full px-3 sm:px-4 mx-auto max-w-full xl:max-w-screen-2xl">
          <header className="mb-6 sm:mb-8 flex flex-col items-center">
            <div className="w-full flex justify-end mb-4">
              <ModeToggle />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
              School Timetable Builder
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Create and manage your school timetable with drag-and-drop
              simplicity
            </p>
          </header>

          <div className="bg-white dark:bg-card text-gray-800 dark:text-card-foreground rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100 dark:border-transparent">
            <TimetableControls />
          </div>

          <div className="bg-white dark:bg-card text-gray-800 dark:text-card-foreground rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100 dark:border-transparent">
            <h2 className="text-xl font-semibold mb-4">Timetable</h2>
            <TimetableGrid />
          </div>

          <footer className="text-center text-gray-500 dark:text-muted-foreground text-sm mt-6 sm:mt-8 pb-6 sm:pb-8">
            <p>School Timetable Builder &copy; {new Date().getFullYear()}</p>
            <p className="mt-1 text-xs opacity-75">Built for Sachin with ❤️</p>
          </footer>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
