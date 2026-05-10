# Feature F008 — Dark Mode / Theme Toggle

**Status:** Done
**Feature ID:** F008

---

## Requirements

- Toolbar has a toggle button (sun/moon icon) to switch between light/dark/system theme
- Tailwind dark mode classes apply throughout the app
- Preference persists via next-themes

---

## Planning

**Problem:** No dark mode — bright UI was uncomfortable for extended workshop use.

**Solution:** `next-themes` package with `ThemeProvider` in `layout.tsx`, `useTheme()` hook in `WorkflowCanvas`.

---

## Implementation Summary

**Files changed:**
- `frontend/app/layout.tsx` — added `ThemeProvider` wrapper with `attribute="class"`
- `frontend/app/components/workflow/WorkflowCanvas.tsx` — toggle button + `useTheme`
- `frontend/package.json` — added `next-themes`

**Toggle button:** Sun icon (shown in dark mode, click to go light) / Moon icon (shown in light mode, click to go dark). Class-based: `dark:bg-gray-900 dark:text-white` etc.

---

## Caveats

- Not all components may be fully dark-mode styled — some inline styles or third-party libs may not respect the class
- Theme preference stored in localStorage — no server sync