/** One stop of the guided tour: the element marked data-tour="<target>", shown in a lesson mode. */
export interface TourStep {
  id: string;
  target: string;
  mode?: "learn" | "lab";
}

/** Remembered in the browser once the tour is finished or skipped. */
export const TOUR_DONE_KEY = "mllab:tour-done";

/** The tour a first-time visitor gets on the first lesson; the "?" button replays it on any lesson. */
export const LESSON_TOUR: TourStep[] = [
  { id: "story", target: "story", mode: "learn" },
  { id: "rail", target: "rail", mode: "learn" },
  { id: "keyIdea", target: "key-idea", mode: "learn" },
  { id: "mode", target: "mode", mode: "learn" },
  { id: "data", target: "lab-data", mode: "lab" },
  { id: "player", target: "player", mode: "lab" },
  { id: "stage", target: "stage", mode: "lab" },
  { id: "code", target: "code", mode: "lab" },
  { id: "breakIt", target: "break-it", mode: "lab" },
  { id: "search", target: "search" },
];
