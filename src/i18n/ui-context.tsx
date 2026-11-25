"use client";

import { createContext, useCallback, useContext } from "react";
import type { UiStrings } from "@/content/schema";

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

const UiContext = createContext<UiStrings>({});

export function UiProvider({ strings, children }: { strings: UiStrings; children: React.ReactNode }) {
  return <UiContext.Provider value={strings}>{children}</UiContext.Provider>;
}

export function translate(strings: UiStrings, key: string, vars?: Record<string, string | number>): string {
  const template = strings[key];
  if (template === undefined) {
    if (process.env.NODE_ENV !== "production") console.warn(`Missing UI string: ${key}`);
    return key;
  }
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function useT(): TFunction {
  const strings = useContext(UiContext);
  return useCallback((key, vars) => translate(strings, key, vars), [strings]);
}
