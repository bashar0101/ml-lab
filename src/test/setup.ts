import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  if (typeof window === "undefined") return; // node-environment test files
  window.localStorage.clear();
  window.location.hash = "";
});
