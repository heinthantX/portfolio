# Command menu

A terminal-styled command palette. It is a site feature, not a page, and it lives in `src/components/site/command-menu.tsx`.

## Architecture
- Window chrome: a title bar with three dots, then a tab strip.
- Tabs: `~`, `~/pages`, `~/projects`, `~/notes`, `~/actions`, numbered 1–5. A tab filters the command groups it shows.
- Tab buttons use `tabIndex={-1}`. Tab and Shift+Tab cycle the tabs, so the buttons must not also take focus in the tab order.
- The prompt shows the current tab path before `>` (for example `~/projects >`).
- Commands come from the `COMMANDS` list. Matching is exact and case-insensitive. There is no fuzzy search.
- Input placeholder: "Type a command or search...". It is fixed. The e2e tests locate the input by it, so do not change it.
- Closing the menu resets the active tab to `~`.

## Core Flows
1. **Pick a tab:** click a tab, or use Tab and Shift+Tab to cycle. The group list filters to that tab.
2. **Run a command:** type the exact command name in any case and press Enter. Output appears in the terminal log. Commands:
   - `help`: list of every command. Each name is clickable and runs that command.
   - `whoami`: identity output.
   - `neofetch`: an HT logo drawn with box-drawing characters, plus user, role, tz, stack, projects, notes and status from the profile. Rows whose value is 0 are hidden.
   - `ls projects`: project slugs. Each slug is clickable.
   - `git log`: notes shown as commits. Each has a stable FNV short hash. The newest is marked "(HEAD → main)".
   - `kubectl get skills`: the skills list.
   - `sudo hire-me`: a fake sudo password prompt. Enter navigates to `/contact`.
3. **Footer:** suggests `help` and `neofetch`.
4. **Close and reopen:** the tab resets to `~`.

## Edge Cases
- Only exact matches run. Partial or misspelled input does not match a command.
- `neofetch` rows with a value of 0 are not rendered, so the box never shows empty rows.
- The git short hash is stable: the same note shows the same hash on every render.
- The tab buttons are not in the tab order. Keyboard users reach the tabs through Tab and Shift+Tab, which cycle them.
- The placeholder is an e2e contract. Changing its text breaks the command-menu tests.

## Autonomous UX Polish
- Clickable command names in `help` output and clickable slugs in `ls projects` output, so users can click through instead of typing.
- The empty state hints at `help` and the Tab key, so a new visitor knows where to start.
- The footer suggests `help` and `neofetch` as the starting commands.
- The prompt shows the active tab path, so the user always knows which group they are filtering.
- Tab / Shift+Tab cycle the tabs from the keyboard, with no mouse needed.
