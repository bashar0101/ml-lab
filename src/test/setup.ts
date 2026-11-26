import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// findBy*/waitFor: lesson modules load lazily, which can take a while under a full parallel run.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  if (typeof window === "undefined") return; // node-environment test files
  window.localStorage.clear();
  window.location.hash = "";
});
