# Task 14.1: Dashboard Hero Dark-Mode Contrast & Scrollbar-Free Other Active Reads Grid

**Phase:** [Phase 14: Visual Polish, Responsive Layout & UX Refinements](index.md)  
**Status:** Pending  
**Recommended Model:** Gemini 4 Hydrogen (Medium) or Gemini 4 Neon (Medium)

---

## 1. Objective

Fix two visual defects in `CurrentlyReadingHeroComponent`:

1. Repair broken dark-mode hover contrast on the "Add detailed reading log" (`Añadir lectura detallada`) button caused by the non-existent Tailwind utility `dark:hover:bg-slate-750`.
2. Replace the horizontally scrollable "Other active reads" strip (`overflow-x-auto pb-2`) with a clean responsive grid (`grid-cols-1 sm:grid-cols-2`) that eliminates the ugly horizontal scrollbar on tablet/mobile and provides proper spacing so hover lift (`hover:-translate-y-0.5`) never clips against the top edge.

---

## 2. Target Files & Line Pointers

- `src/app/features/dashboard/components/currently-reading-hero/currently-reading-hero.html` — L176-L198 ("Add detailed reading log" button), L305-L362 ("Other active reads" strip).
- `src/app/features/dashboard/components/currently-reading-hero/currently-reading-hero.spec.ts` — Add unit/regression assertions.

---

## 3. Implementation Checklist

- [ ] **Fix dark-mode hover contrast (`currently-reading-hero.html` L176-L198):**
  - Replace invalid `dark:hover:bg-slate-750` with `dark:hover:bg-slate-700 dark:hover:border-slate-600 dark:hover:text-white` so both text and icon maintain WCAG 2.1 AA contrast on hover in dark mode.
  - Ensure the icon inside also transitions cleanly (`group-hover` or inherited contrast).
- [ ] **Replace horizontal scroll strip with responsive 2-column grid (`currently-reading-hero.html` L305-L362):**
  - Replace `mt-3 flex gap-3 overflow-x-auto pb-2` with `mt-3 grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2` (or `@[560px]:grid-cols-2` if wrapped in `@container`).
  - Change each card button from `shrink-0` with fixed `w-36` text container to `w-full min-w-0` with `min-w-0 flex-1` text container so cards fill their grid column evenly, never overflow horizontally, and never clip when lifted via `hover:-translate-y-0.5` (guaranteed by `pt-1` and absence of `overflow-x-auto` clipping context).
- [ ] **Unit & Regression Tests (`currently-reading-hero.spec.ts`):**
  - Assert that the full-log button does **not** contain `dark:hover:bg-slate-750` and includes `dark:hover:bg-slate-700`.
  - Assert that when `otherActiveBooks` has multiple items, the container renders a CSS Grid (`grid`) without `overflow-x-auto` and renders all secondary active books cleanly.

---

## 4. Verification Gate

1. `npm run test:file -- src/app/features/dashboard/components/currently-reading-hero/currently-reading-hero.spec.ts`
2. `npm run verify:quiet`
3. Tier 1 Doc Sync: Mark Task 14.1 `[x]` in `docs/tasks/phase-14-visual-polish-and-responsive-ux/index.md`.
