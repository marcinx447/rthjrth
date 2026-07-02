export type CategoryDef = { id: string; label: string };

export const CATEGORIES: CategoryDef[] = [
  { id: "all", label: "Wszystko" },
  { id: "shorts", label: "Szorty" },
  { id: "t-shirts", label: "T-shirty" },
  { id: "sportswear", label: "Sportowe" },
  { id: "hoodies", label: "Bluzy" },
  { id: "headwear", label: "Czapki" },
  { id: "shoes", label: "Buty" },
  { id: "underwear", label: "Bielizna" },
  { id: "pants", label: "Spodnie" },
  { id: "belts", label: "Paski" },
  { id: "electronics", label: "Elektronika" },
  { id: "jackets", label: "Kurtki" },
  { id: "accessories", label: "Akcesoria" },
];

export const ADMIN_CATEGORIES = CATEGORIES.filter((c) => c.id !== "all");

export const BATCHES = [
  { id: "budget", label: "Budget Batch" },
  { id: "good", label: "Good Batch" },
  { id: "polyester", label: "Poliester Batch" },
  { id: "best", label: "Best Batch" },
];