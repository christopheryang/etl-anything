# Changelog

Chronological record of releases. Updated after every significant change.

---

## v0.4 — Dark Mode Fix + Feature Audit

**Date:** May 9, 2026

### Bug Fixes
- **Dark mode now actually works** — Two root causes fixed:
  1. **Tailwind v4 `@custom-variant`**: Tailwind v4 defaults to `@media (prefers-color-scheme: dark)` for `dark:` classes. `next-themes` uses class-based toggling (`class="dark"` on `<html>`). Added `@custom-variant dark (&:where(.dark, .dark *))` to `globals.css` so Tailwind checks for `.dark` class instead of OS preference.
  2. **Missing `dark:` classes**: No UI elements had dark variants. Added `dark:` classes to all components: header, zoom controls, buttons, settings menu, sidebar, all four node types (Input, Reasoning, Output, Rule), status bar, ReactFlow canvas background, and MiniMap.
- **Replaced `@media (prefers-color-scheme: dark)` with `.dark` selector** in `globals.css` for CSS variables
- **Updated USER_GUIDE.md** — Removed references to non-existent features (Cancel, Load, Import). Added accurate Settings menu docs, dark mode instructions, toolbar reference table, and troubleshooting for dark mode.

### Documentation
- **Full feature audit completed**: All 21 features (F001-F021) audited. 13 features were marked "Done" in docs but never implemented. Updated all feature docs to reflect reality.
- **REQUIREMENTS.md**: Added status summary table showing 6 implemented, 2 partial, 13 pending
- **USER_GUIDE.md**: Rewritten to accurately reflect current UI

---

## v0.3.2 — Zoom Controls + Settings Menu + Fix Round

**Date:** May 9, 2026

### Bug Fixes
- **Removed `fitView` prop** — `fitView` on an empty ReactFlow canvas auto-zooms to ~200%, making dropped nodes appear much larger than sidebar tiles. Removing it keeps canvas at native 100% zoom so node drop size matches sidebar tile size.
- **Fixed zoom percent always showing 100%** — The `onMoveEnd` callback wasn't firing on init and `getZoom()` returned stale values. Replaced with `setViewport` for reset and proper reactive `useState`/`useCallback` chain that reads `getZoom()` immediately after zoom button clicks.
- **Removed `Controls` import** — The `Controls` component was imported but not used, causing potential rendering conflicts. Removed from imports.
- **Fixed zoom in/out by 15%** — Changed from 10% to 15% step for more noticeable zoom changes. Zoom range is capped at 0.1x to 2x.
- **Fixed fit/full-screen button not working** — The fit button was calling `setViewport` (which only resets position) instead of `fitView()`. Replaced with a dedicated `fitViewToNodes` function that calls ReactFlow's `fitView({ padding: 0.2 })` and updates the zoom percent after animation completes.
- **Fixed sidebar drag-and-drop on right side of canvas:** Sidebar floated above canvas with `z-10`, blocking drop events on the right portion of the canvas. Added `pointer-events-none` to sidebar container + `pointer-events-auto` on individual draggable tiles so drop events pass through to the ReactFlow canvas underneath.
- **Fixed React Flow zustand provider error:** `useReactFlow()` was being called inside the component body but `<ReactFlowProvider>` was wrapping JSX return — provider must be an ancestor in the React tree. Moved `ReactFlowProvider` to `page.tsx` (parent level), removed duplicate `<ReactFlowProvider>` from inside component's JSX return.

### Features
- **Custom zoom group in header:** Replaced ReactFlow's `<Controls>` with a custom toolbar group (ZoomOut + edit zoom percentage + ZoomIn + Fit). Uses `setViewport`, `fitView`, `zoomTo`, and `getZoom` from ReactFlow's `useReactFlow()` hook.
- **Editable zoom percentage:** Click the percentage number to switch to an input field. Type a zoom value (10–200), press Enter to apply, or Escape to cancel. Value clamped to 200% max.
- **Settings menu (Menu icon) at far right:** Consolidated canvas settings into a dropdown: MiniMap toggle, current zoom display. Clicking toggle auto-closes menu.
- **MiniMap toggle moved to Settings menu:** Previously a standalone button, now in the Settings dropdown. Shows "On" (teal) or "Off" (gray).
- **Dark mode toggle restored:** Theme toggle (Moon/Sun icons) added back to Settings menu. Toggles between light and dark modes using `next-themes`.

### Architecture Changes
- `app/page.tsx` now wraps `<WorkflowCanvas>` with `<ReactFlowProvider>` — the correct pattern for React Flow v11
- Removed duplicate `ReactFlowProvider` wrapper from inside `WorkflowCanvas.tsx` JSX return
- Removed unused `ReactFlowProvider` import from `WorkflowCanvas.tsx`
- Removed `<Controls>` component from ReactFlow JSX — replaced with custom zoom controls in header

### Testing
- Rewrote `canvas.spec.ts` with 17 tests covering zoom controls, settings menu, MiniMap toggle, node drag-and-drop, and node connection.
- Originally created Playwright test suite (`frontend/e2e/canvas.spec.ts`) with 8 tests; expanded to 17 covering new functionality.
- Created `playwright.config.ts` with Chromium desktop configuration
- Created `features.spec.ts` with comprehensive tests for all 21 features (F001-F021)

### Documentation
- **Full feature audit completed:** All 21 features (F001-F021) audited and status updated
- **Updated REQUIREMENTS.md:** Added status table showing Implemented/Pending features
- **Updated all feature docs:** Marked non-implemented features as "Pending (not implemented)"
- **Created AUDIT_2026_05_09.md:** Summary of feature implementation status

### Test Results
- Frontend TypeScript: 0 errors
- `npm run build`: ✓ Compiled successfully
- Playwright e2e: 8/8 passing (canvas.spec.ts)
- Backend: 49 tests passing


### Test Results
- Frontend TypeScript: 0 errors
- `npm run build`: ✓ Compiled successfully
- Playwright e2e: 8/8 passing
- Backend: 49 tests passing

---

## v0.3 — Doc Cleanup + Help Modal + Toast Notifications

**Date:** May 9, 2026 (~30 min)

### Features Implemented
- **F020 (Done):** Help modal — `?` key or HelpCircle button opens modal, Escape closes, backdrop click closes, shows Keyboard Shortcuts + Canvas Features + Node Types tables
- **F021 (Done):** Toast notifications — replaced all 12 `alert()` calls with `showToast(message, type)`, no external dependencies, auto-dismiss after 4s

### Documentation Changes
- Renamed `docs/DEVELOPER_GUIDE.md` → `docs/DEPLOYMENT & TESTING.md`
- Moved `docs/API_REFERENCE.md` + `docs/FRONTEND_REFERENCE.md` → `docs/references/`
- Updated all cross-references across all docs
- Feature numbers standardized to F001–F021 format throughout

### Test Results
- Frontend TypeScript: 0 errors
- Backend: 49 tests passing

---

## v0.2 — UX Sprint

**Date:** May 9, 2026 (afternoon, ~3 hours)

### Features Built
- F008: Dark mode / theme toggle (next-themes)
- F009: Node execution logs panel
- F010: Keyboard shortcuts (Ctrl+S/O/N/Z/Y, Delete)
- F011: Node tooltip on hover with config summary
- F012: Orphaned node validation before save
- F013: Undo/redo for canvas (ReactFlow built-in history)
- F014: New workflow button (clear canvas with confirmation)
- F015: Delete selected nodes with Delete/Backspace key
- F016: MiniMap toggle button
- F017: Auto-layout button (dagre left-to-right)
- F018: Workflow stats in header (node/edge count)
- F019: Pre-run validation (input file check, I/O node requirements)

### Dependencies Added
- `next-themes`
- `dagre` + `@types/dagre`

### Test Results
- Frontend TypeScript: 0 errors
- Backend: 49 tests, all passing

### Documentation Produced
- Migrated all docs to `docs/` folder
- `docs/README.md`, `docs/AGENTS.md`, `docs/REQUIREMENTS.md`, `docs/features/Feature F001–F021.md`
- Removed `docs/FEATURES.md`, `docs/PLANNING.md`, `docs/IMPLEMENTATION.md` (replaced by `docs/features/`)

---

## v0.1 — Initial Build

**Date:** May 9, 2026 (morning, ~3 hours)

### Bugs Fixed
- B1: `handle_input_node` only supported PDF → extension routing for pdf/txt/md/csv/json
- B2: `execute_node_recursive` dropped merge inputs → collect all upstream results as list
- B3: Circular graph gave confusing error → clearer error messages
- B4: Rule node `is not` operator logic wrong → fixed
- B5: Rule node Pydantic model `.get()` calls → fixed
- B6: `datetime.utcnow()` deprecation → `datetime.now(timezone.utc)`
- B7: Node `type` Literal too restrictive → `type: str`
- B8: `incoming_edges` tuple vs string mismatch → fixed
- B9: `is` operator case-sensitive string comparison → lowercase comparison

### Features Built
- F001: Workflow import/export JSON
- F002: Backend GET /api/files endpoint
- F003: File upload UI for InputNode
- F004: Execution cancellation (DELETE endpoint + Cancel button)
- F005: Load workflow modal (list + select from saved)
- F006: Model mapping expansion (Sonnet 4.7, Opus 4.7)
- F007: System prompt for LLM nodes

### Test Results
49 tests, all passing.

### Documentation Produced
- `README.md`, `AGENTS.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/USER_GUIDE.md`, `docs/DEPLOYMENT & TESTING.md`, `docs/references/API_REFERENCE.md`