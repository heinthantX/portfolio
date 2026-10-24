# Command menu

A terminal-styled command palette. It is a site feature, not a page, and it lives in `src/components/site/command-menu.tsx`. Completion logic is in `src/components/site/complete.ts` (tests in `complete.test.ts`).

## Architecture
- Window chrome: a title bar with three dots, then a tab strip.
- Tabs: `~`, `~/pages`, `~/projects`, `~/notes`, `~/actions`, numbered 1–5. A tab filters the command groups it shows.
- Tab buttons use `tabIndex={-1}`. With empty input, Tab and Shift+Tab switch tabs, so the buttons must not also take focus in the tab order. With text in the input, Tab completes instead (Core Flows 3).
- The prompt shows the current tab path before `>` (for example `~/projects >`).
- Commands come from the `COMMANDS` list. Enter runs only an exact, case-insensitive match. There is no fuzzy search.
- Completion: `complete(input, candidates)` returns `{ matches, common }`. Matching is a case-insensitive prefix match. Candidates are the `COMMANDS` names plus every item href.
- Input placeholder: "Type a command or search...". It is fixed. The e2e tests locate the input by it, so do not change it.
- Closing the menu resets the active tab to `~`.

## Core Flows
1. **Pick a tab:** click a tab, or with empty input press Tab or Shift+Tab to switch. The group list filters to that tab.
2. **Run a command:** type the exact command name in any case and press Enter. Output appears in the terminal log. Commands:
   - `help`: list of every command. Each name is clickable and runs that command.
   - `whoami`: identity output.
   - `neofetch`: an HT logo drawn with box-drawing characters, plus user, role, tz, stack, projects, notes and status from the profile. Rows whose value is 0 are hidden.
   - `ls projects`: project slugs. Each slug is clickable.
   - `git log`: notes shown as commits. Each has a stable FNV short hash. The newest is marked "(HEAD → main)".
   - `kubectl get skills`: the skills list.
   - `sudo hire-me`: a fake sudo password prompt. Enter navigates to `/contact`.
3. **Complete (Tab with text in the input):**
   - The first Tab fills the shared prefix of all matches (`common`).
   - Further Tabs cycle through the matches. `stemRef` holds the typed stem and resets on typing.
   - A ghost hint behind the input shows the rest of the first match.
   - Tab calls `stopPropagation` as well as `preventDefault`, so the Radix dialog focus trap never moves focus off the input (`docs/memory/fixes.md`).
   - Completion never runs a command. Enter still needs an exact match.
   - Verified example chain: `who` → `whoami`; `/w` → `/work` → `/work/this-portfolio`; `sud` → `sudo hire-me`. Then Enter on `/contact` opens the page.
4. **Footer:** suggests `help` and `neofetch`. The key hint reads "Complete / tabs Tab".
5. **Close and reopen:** the tab resets to `~`.

## Edge Cases
- Only exact matches run. Partial or misspelled input does not match a command. Tab completes a prefix but never runs anything.
- `neofetch` rows with a value of 0 are not rendered, so the box never shows empty rows.
- The git short hash is stable: the same note shows the same hash on every render.
- The tab buttons are not in the tab order. Keyboard users reach the tabs with Tab and Shift+Tab on empty input. With text typed, Tab completes instead.
- The placeholder is an e2e contract. Changing its text breaks the command-menu tests.

## Autonomous UX Polish
- Clickable command names in `help` output and clickable slugs in `ls projects` output, so users can click through instead of typing.
- The empty state hints at `help` and the Tab key, so a new visitor knows where to start.
- The footer suggests `help` and `neofetch` as the starting commands.
- The prompt shows the active tab path, so the user always knows which group they are filtering.
- Ghost completion hint: the rest of the first match shows behind the input, so the completion is visible before Tab is pressed.
- Tab completes commands and hrefs, and Shift+Tab or empty-input Tab switches tabs, all from the keyboard.
