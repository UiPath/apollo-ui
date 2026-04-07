"use client";

const TOUR_STORAGE_KEY = "onboarding-tour-completed";

function loadCompletedTours(): string[] {
  try {
    const data = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!data) return [];
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function useTourPersistence() {
  function isTourCompleted(tourId: string): boolean {
    return loadCompletedTours().includes(tourId);
  }

  function markTourCompleted(tourId: string) {
    const completed = loadCompletedTours();
    if (!completed.includes(tourId)) {
      completed.push(tourId);
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completed));
    }
  }

  function resetTourState(tourId: string) {
    const completed = loadCompletedTours().filter((id) => id !== tourId);
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completed));
  }

  return { isTourCompleted, markTourCompleted, resetTourState };
}

export { useTourPersistence };
