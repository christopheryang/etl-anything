# Feature F008 — Dark Mode / Theme Toggle

**Status:** Done

---

## Requirements

- **FR1:** Toolbar has a toggle button (sun/moon icon) to switch between light/dark/system theme
- **FR2:** Tailwind dark mode classes apply throughout the app
- **FR3:** Preference persists via next-themes
- **NFR1:** No breaking changes to existing functionality

---

## Planning

**Problem:** No dark mode — bright UI was uncomfortable for extended workshop use.

**Solution:** `next-themes` package with `ThemeProvider` in `layout.tsx`, `useTheme()` hook in `WorkflowCanvas`.

---

## Implementation

**Files changed:**
- `frontend/app/layout.tsx` — added `ThemeProvider` wrapper with `attribute="class"`
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — toggle button + `useTheme`
- `frontend/package.json` — added `next-themes`

**Toggle button:** Sun icon (shown in dark mode, click to go light) / Moon icon (shown in light mode, click to go dark). Class-based: `dark:bg-gray-900 dark:text-white` etc.

---

## Acceptance Criteria

- [ ] **FR1:** Toolbar has a toggle button (sun/moon icon) to switch between light/dark/system theme
- [ ] **FR2:** Tailwind dark mode classes apply throughout the app
- [ ] **FR3:** Preference persists via next-themes
- [ ] **NFR1:** No breaking changes to existing functionality

---

## Test Cases

- Verify feature works per requirements
- Run `cd backend && source venv/bin/activate && python -m pytest tests/ -q`
- Run `cd frontend && npx -p typescript tsc --noEmit`

---

## Caveats

- Not all components may be fully dark-mode styled — some inline styles or third-party libs may not respect the class
- Theme preference stored in localStorage — no server sync

---

## Files Modified

- `frontend/app/layout.tsx` — added `ThemeProvider` wrapper with `attribute="class"`
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — toggle button + `useTheme`
- `frontend/package.json` — added `next-themes`
