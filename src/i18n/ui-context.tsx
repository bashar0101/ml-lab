"use client";

import { createContext, useCallback, useContext } from "react";
import type { UiStrings } from "@/content/schema";
import { translate } from "./translate";

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

const UiContext = createContext<UiStrings>({});

export function UiProvider({ strings, children }: { strings: UiStrings; children: React.ReactNode }) {
  return <UiContext.Provider value={strings}>{children}</UiContext.Provider>;
}

export function useT(): TFunction {
  const strings = useContext(UiContext);
  return useCallback((key, vars) => translate(strings, key, vars), [strings]);
}
