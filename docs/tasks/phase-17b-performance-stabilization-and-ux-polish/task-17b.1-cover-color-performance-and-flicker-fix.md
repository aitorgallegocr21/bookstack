# Task 17B.1: Fix `/books` CPU Spike, Infinite LRU Thrashing & Cover Tint Flicker

- **Phase:** 17B — Performance Stabilization, Route Transitions & Editorial UX Polish (`v2.3.1`)
- **Status:** Completed
- **Goal:** Completely eliminate the `/books` route load lag, CPU fan spike, and continuous `BookDetailModal` cover-tint flicker by re-architecting `CoverColorService` to $O(1)$ per-key signal reactivity with a bounded idle extraction queue, zero in-memory LRU eviction thrashing, debounced persistence, and CSS render containment on catalog cards.

---

## 1. Root-Cause Analysis

1. **Monolithic `cacheSignal` ($O(N^2)$ Signal Notification Storm):**
   - `CoverColorService` stores all cached colors in a single `cacheSignal = signal<Record<string, string>>({})`.
   - Every card (`BookGridCardComponent`, `BookDetailedCardComponent`, `BookCompactRowComponent`, `SagaBentoCardComponent`) and `BookDetailModalComponent` calls `coverColorService.getTint(book)` inside a `computed()`.
   - Whenever 1 book finishes extraction, `cacheSignal.set(Object.fromEntries(this.cache))` notifies **every** mounted card simultaneously ($N$ extractions $\times N$ cards $= O(N^2)$ signal re-evaluations).
2. **Infinite LRU Eviction Thrashing Loop (`MAX_CACHE_ENTRIES = 250`):**
   - When a library contains $> 250$ books with covers, inserting entry #251 evicts entry #1 from `this.cache`.
   - Because `cacheSignal` updates, card #1's `computed()` re-runs, encounters a cache miss, reverts to the fallback tint (causing visible flicker!), and schedules `extractAndCache(book1)` again.
   - When book #1 finishes, it evicts book #2, repeating indefinitely at 100% CPU and causing `BookDetailModal` to flicker nonstop between its extracted cover color and fallback/theme color.
3. **Unbounded Concurrency & Synchronous Disk Writes:**
   - Every uncached cover immediately schedules `queueMicrotask(() => extractAndCache(...))`, launching hundreds of concurrent `new Image()` decoders and `<canvas>` `getImageData()` GPU readbacks on `/books` navigation.
   - `persistToStorage()` calls `localStorage.setItem(COVER_TINT_STORAGE_KEY, JSON.stringify(entries))` synchronously on the main thread after **every single book**.
4. **Uncontained Offscreen Catalog Cards:**
   - Large libraries render all cards at once without `content-visibility: auto`, forcing the browser to lay out and paint offscreen cards immediately during `/books` navigation.

---

## 2. Implementation Specification

### A. `CoverColorService` Re-Architecture (`src/app/core/services/cover-color.service.ts`)

1. **Per-Key Granular Signals ($O(1)$ Reactivity):**
   - Replace `private readonly cacheSignal = signal<Record<string, string>>({})` with:
     ```ts
     private readonly entrySignals = new Map<string, WritableSignal<string>>();
     ```
   - `getTint(book)` looks up (or creates) `entrySignals.get(cacheKey)` initialized with the cached color (if hydrated from `localStorage`) or `fallback`, and returns `entrySignal()`.
   - Updating a single book calls `entrySignal.set(resolvedColor)` — **zero other cards are notified or re-evaluated**.
2. **Eliminate In-Memory LRU Eviction Thrashing:**
   - Never evict active keys from `this.cache` or `this.entrySignals` during a session (even 5,000 entries use $< 500\text{ KB}$ of RAM).
   - Keep `MAX_PERSISTED_ENTRIES = 500` strictly when serializing to `localStorage` in `persistToStorage()`.
   - Track `private readonly resolvedKeys = new Set<string>()` so a book whose extraction completed (or failed to fallback) is never re-queued for the same `cacheKey`.
3. **Bounded Idle Extraction Queue (Max Concurrency = 2):**
   - Replace direct `queueMicrotask(() => extractAndCache(...))` with an internal FIFO/priority queue (`private readonly queue: ExtractionJob[] = []`) and `private activeExtractions = 0` (`MAX_CONCURRENT_EXTRACTIONS = 2`).
   - Add an optional `priority?: 'high' | 'normal'` parameter to `getTint(book, priority = 'normal')` so `BookDetailModalComponent` can request `'high'` priority (unshifted to the front of the queue) while background catalog cards use `'normal'`.
   - Schedule queue draining via `requestIdleCallback` (with `setTimeout(..., 16)` fallback for Safari/jsdom) so `/books` route rendering and user input always take priority over background canvas sampling.
   - Reuse a single shared `16×16` offscreen `<canvas>` instance (`private sampleCanvas: HTMLCanvasElement | null = null`) instead of allocating a new `<canvas>` DOM node per book.
4. **Debounced `localStorage` Persistence (`500ms`):**
   - Replace immediate `this.persistToStorage()` calls with `this.schedulePersist()`, which clears any pending `persistTimer` and flushes once after `500ms` of quiet.

### B. Catalog Card Render Containment (`src/styles.css` & Card Components)

1. Add a reusable utility class `.catalog-card-contain` in `src/styles.css`:
   ```css
   .catalog-card-contain {
     contain: layout style paint;
     content-visibility: auto;
     contain-intrinsic-size: auto 220px;
   }
   ```
   (And `.catalog-row-contain` with `contain-intrinsic-size: auto 64px` for compact rows.)
2. Apply `catalog-card-contain` to `BookGridCardComponent` and `BookDetailedCardComponent` host/article elements, and `catalog-row-contain` to `BookCompactRowComponent`.
3. Pass `'high'` priority in `BookDetailModalComponent.bookTint`:
   `this.coverColorService.getTint(currentBook, 'high')`.

---

## 3. Target Files & Line Pointers

- `src/app/core/services/cover-color.service.ts` (L1-L314 — full service refactor: per-key signals, bounded idle queue, reused canvas, debounced persistence, zero in-memory eviction)
- `src/app/core/services/cover-color.service.spec.ts` (L1-L160 — expand with regression tests)
- `src/app/features/books/components/book-detail-modal/book-detail-modal.ts` (L67-L70 — pass `'high'` priority to `getTint`)
- `src/app/features/books/components/book-grid-card/book-grid-card.ts` (L22-L24 — host class containment)
- `src/app/features/books/components/book-detailed-card/book-detailed-card.ts` (L25-L27 — host class containment)
- `src/app/features/books/components/book-compact-row/book-compact-row.ts` (L16-L22 — host class containment)
- `src/styles.css` (L491-L545 — add `.catalog-card-contain` and `.catalog-row-contain`)

---

## 4. Verification & Acceptance Criteria

- [x] Unit test (`cover-color.service.spec.ts`): Calling `getTint()` for 300 distinct books with covers does **not** evict or re-extract earlier books (each book extracts at most once).
- [x] Unit test (`cover-color.service.spec.ts`): Updating book A's tint does **not** re-run a `computed()` reading book B's tint ($O(1)$ signal isolation).
- [x] Unit test (`cover-color.service.spec.ts`): Concurrent extractions never exceed `2`, and `localStorage.setItem` is debounced rather than called per book.
- [x] `BookDetailModal` displays a steady `--book-tint` with zero flickering even in a library with 300+ books.
- [x] `npm run test:file -- src/app/core/services/cover-color.service.spec.ts` and `npm run verify:quiet` pass.
