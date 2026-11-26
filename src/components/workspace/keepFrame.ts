import type { AnyLessonModule } from "@/lessons/types";

/** Whether a Lab edit should keep the player on its current frame instead of starting over. */
export function keepsFrame(
  mod: Pick<AnyLessonModule, "viewOnly" | "keepFrameOnData">,
  prev: { params: unknown; error: string | null } | null,
  patch: { params?: unknown; data?: unknown },
): boolean {
  if (!prev || prev.error) return false;
  if (patch.data !== undefined) return !!mod.keepFrameOnData && (patch.params === undefined || !!mod.viewOnly?.(prev.params, patch.params));
  return patch.params !== undefined && !!mod.viewOnly?.(prev.params, patch.params);
}
