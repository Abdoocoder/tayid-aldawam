import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves area IDs to human-readable names.
 * Handles:
 * - 'ALL': returns the provided allLabel
 * - Single ID: returns the area name or the ID itself if not found
 * - Comma-separated IDs: returns names joined by commas
 * 
 * @param areaId The raw areaId string (UUID, comma-separated UUIDs, or 'ALL')
 * @param areas The list of areas to look up names from
 * @param allLabel The label to use for 'ALL'
 */
export function resolveAreaNames(areaId: string | undefined | null, areas: { id: string, name: string }[], allLabel: string = "جميع المناطق") {
  if (!areaId) return "غير محدد";
  if (areaId === 'ALL') return allLabel;

  return areaId
    .split(',')
    .map(id => areas.find(a => a.id === id.trim())?.name || id.trim())
    .join('، ');
}
