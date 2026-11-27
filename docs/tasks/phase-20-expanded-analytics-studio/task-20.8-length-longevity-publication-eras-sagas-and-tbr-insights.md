# Task 20.8: Length & Longevity, Publication Eras, Saga Analytics & TBR/Publishers Insights

## Objective

Build the 4 deep-insight Bento widgets that transform BookStack `/stats` into a comprehensive personal library intelligence hub: **Book Length & Longevity**, **Publication Eras & Decades**, **Sagas & Series Progress**, and **TBR Backlog Reality Check & Top Publishers**.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/analytics/components/length-longevity-widget/length-longevity-widget.ts`
  - `src/app/features/analytics/components/length-longevity-widget/length-longevity-widget.html`
  - `src/app/features/analytics/components/length-longevity-widget/length-longevity-widget.spec.ts`
  - `src/app/features/analytics/components/publication-eras-widget/publication-eras-widget.ts`
  - `src/app/features/analytics/components/publication-eras-widget/publication-eras-widget.html`
  - `src/app/features/analytics/components/publication-eras-widget/publication-eras-widget.spec.ts`
  - `src/app/features/analytics/components/saga-analytics-widget/saga-analytics-widget.ts`
  - `src/app/features/analytics/components/saga-analytics-widget/saga-analytics-widget.html`
  - `src/app/features/analytics/components/saga-analytics-widget/saga-analytics-widget.spec.ts`
  - `src/app/features/analytics/components/backlog-publishers-widget/backlog-publishers-widget.ts`
  - `src/app/features/analytics/components/backlog-publishers-widget/backlog-publishers-widget.html`
  - `src/app/features/analytics/components/backlog-publishers-widget/backlog-publishers-widget.spec.ts`
- **Read & Edit:**
  - `src/app/features/analytics/pages/stats-page/stats-page.ts` & `stats-page.html` — wire all 4 widgets into their corresponding `@switch` slots (`length-longevity`, `publication-eras`, `saga-analytics`, `backlog-publishers`).

---

## Functional & Technical Requirements

1. **Book Length & Reading Longevity (`LengthLongevityWidgetComponent`):**
   - **4 Length Tiers:** Short (`<250p`), Medium (`250–499p`), Long (`500–749p`), Epic (`750p+`) rendered as clean horizontal bars showing book count, `%`, and average rating per tier (clickable for drill-down `{ type: 'length', tier }`).
   - **Time-to-Finish Longevity Footer:** Average days to finish, Median days to finish, Fastest finish (`book title · X days`), and Longest reading journey (`book title · Y days`), gracefully showing an informative note when books lack `startDate` & `endDate`.
2. **Publication Eras & Decades (`PublicationErasWidgetComponent`):**
   - Compact vertical decade histogram (`<1950`, `50s`, `60s`, `70s`, `80s`, `90s`, `00s`, `10s`, `20s`) using pure SVG/CSS bars (clickable `{ type: 'era', eraKey }`).
   - Editorial footer highlighting **Oldest Classic Read**, **Newest Release Read**, and **Average Publication Year**.
3. **Sagas & Series Progress (`SagaAnalyticsWidgetComponent`):**
   - Powered by `AnalyticsService.sagaAnalytics()` (derived from `SeriesService`).
   - Displays summary KPIs: **Total Sagas**, **Completed Sagas**, **Overall Completion `%`**, and **Volumes Read vs. Remaining**.
   - Lists top 4 sagas by pages read with miniature progress bars and a 1-click **"Explore Sagas →"** link to `/series`.
   - Clean empty state if no books belong to a saga yet.
4. **TBR Backlog Reality Check & Top Publishers (`BacklogPublishersWidgetComponent`):**
   - **TBR / Backlog Section:** Pending books count, total unread pages (`tabular-nums`), and **Estimated Time to Clear TBR** at current reading pace (formatted cleanly as months or years+months, e.g., `~1 year, 2 months`, or `Log reading activity to estimate` when pace is `0`).
   - **Top Publishers Section:** Ranked top 5 publishers by books/pages read (automatically hidden if zero books have `publisher` populated so the card stays clean).

---

## Verification & Acceptance Criteria

- [ ] Unit specs pass for all 4 widgets (`length-longevity-widget`, `publication-eras-widget`, `saga-analytics-widget`, `backlog-publishers-widget`), covering both rich data and sparse/empty metadata states.
- [ ] Zero horizontal overflow at `320px` and full `reducedMotion` compliance.
- [ ] `npm run verify:quiet` passes with zero errors.
