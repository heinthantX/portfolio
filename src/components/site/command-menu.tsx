"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Kbd, SampleBadge } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { profile } from "@/content/profile";
import type { CommandMenuCategory, CommandMenuItem } from "./command-menu-data";
import { complete } from "./complete";

interface CommandMenuProps {
  items: CommandMenuItem[];
}

/** Terminal-style tabs: `Tab` / `Shift+Tab` cycles them, like switching shells. */
const TABS = ["all", "Pages", "Projects", "Notes", "Actions"] as const;
type Tab = (typeof TABS)[number];
const tabPath = (tab: Tab) => (tab === "all" ? "~" : `~/${tab.toLowerCase()}`);

/** Typed commands with a fake terminal reply. Exact match, case-insensitive. */
const COMMANDS = [
  { name: "help", about: "list these commands" },
  { name: "whoami", about: "who built this" },
  { name: "neofetch", about: "system info, portfolio edition" },
  { name: "ls projects", about: "every project slug" },
  { name: "git log", about: "latest notes as commits" },
  { name: "kubectl get skills", about: "the stack, as pods" },
  { name: "sudo hire-me", about: "escalate to the contact page" },
] as const;
type CommandName = (typeof COMMANDS)[number]["name"];

const headingClass =
  "**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[0.6875rem] **:[[cmdk-group-heading]]:tracking-[0.12em] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground";
const itemClass =
  "flex cursor-pointer items-center justify-between font-mono text-xs text-text hover:bg-surface-2 data-selected:bg-surface-2 data-selected:text-signal";
const metaClass =
  "shrink-0 text-[0.6875rem] text-muted-foreground group-data-selected/command-item:text-text";

/** A stable short "commit hash" for a note, so git log reads the same on every open. */
function shortHash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

export function CommandMenu({ items }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  // Keyboard shortcut listener: ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
      setTab("all");
    }
  };

  const go = (href: string) => {
    handleOpenChange(false);
    router.push(href);
  };

  const handleSelect = (item: CommandMenuItem) => {
    if (item.href) {
      go(item.href);
      return;
    }
    handleOpenChange(false);

    if (item.actionId === "toggle-theme") {
      const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
      return;
    }

    if (item.actionId === "copy-email") {
      const email = item.email || profile.contact.email;
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard
          .writeText(email)
          .then(() => {
            toast.success("Email copied to clipboard", {
              description: email,
            });
          })
          .catch(() => {
            toast.error("Failed to copy email to clipboard");
          });
      } else {
        toast.error("Clipboard unavailable");
      }
    }
  };

  const groups = useMemo(() => {
    const by = (g: CommandMenuCategory) => items.filter((i) => i.group === g);
    return {
      Pages: by("Pages"),
      Projects: by("Projects"),
      Notes: by("Notes"),
      Actions: by("Actions"),
    };
  }, [items]);
  const shown = (g: CommandMenuCategory) => (tab === "all" || tab === g) && groups[g].length > 0;

  const trimmed = search.trim().toLowerCase().replace(/\s+/g, " ");
  const command = COMMANDS.find((c) => c.name === trimmed)?.name;

  // Tab completes typed text like a shell: commands and paths. The first Tab fills the shared
  // prefix, further Tabs cycle the matches. With nothing typed (or Shift), Tab switches tabs.
  const candidates = useMemo(
    () => [
      ...new Set([
        ...COMMANDS.map((c) => c.name),
        ...items.flatMap((i) => (i.href ? [i.href] : [])),
      ]),
    ],
    [items],
  );
  const stemRef = useRef<string | null>(null);
  const ghost = stemRef.current
    ? ""
    : (complete(search, candidates).matches[0]?.slice(search.length) ?? "");

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Tab belongs to the prompt here: keep the dialog's focus trap from moving focus off the input
    if (e.key === "Tab") e.stopPropagation();
    if (e.key === "Tab" && !e.shiftKey && search) {
      e.preventDefault();
      const stem = stemRef.current ?? search;
      const { matches, common } = complete(stem, candidates);
      if (stemRef.current === null && common.length > search.length) setSearch(common);
      else if (matches.length > 0) {
        stemRef.current = stem;
        setSearch(matches[(matches.indexOf(search) + 1) % matches.length]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const k = TABS.indexOf(tab) + (e.shiftKey ? -1 : 1);
      setTab(TABS[(k + TABS.length) % TABS.length]);
    } else if (e.key === "Enter" && command === "sudo hire-me") {
      e.preventDefault();
      go("/contact");
    }
  };

  const output: Record<CommandName, () => ReactNode> = {
    help: () => (
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        {COMMANDS.map((c) => (
          <div key={c.name} className="contents">
            <dt>
              <button
                type="button"
                onClick={() => setSearch(c.name)}
                className="text-signal hover:underline"
              >
                {c.name}
              </button>
            </dt>
            <dd className="text-muted-foreground">{c.about}</dd>
          </div>
        ))}
      </dl>
    ),
    whoami: () => (
      <p className="text-signal-strong">
        {profile.name} — {profile.title}
      </p>
    ),
    neofetch: () => (
      <div className="flex gap-6">
        <pre aria-hidden="true" className="hidden leading-tight text-signal sm:block">
          {" ┬ ┬ ┌┬┐\n ├─┤  │ \n ┴ ┴  ┴ "}
        </pre>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {(
            [
              ["user", `visitor@${profile.name.split(" ")[0].toLowerCase()}`],
              ["role", profile.title],
              ["tz", profile.location],
              ["stack", profile.stackLayers.map((l) => l.id).join(" → ")],
              ["projects", String(groups.Projects.length)],
              ["notes", String(groups.Notes.length)],
              ["status", profile.availability.label],
            ] as const
          )
            .filter(([, v]) => v !== "0")
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-signal">{k}</dt>
                <dd className="text-text">{v}</dd>
              </div>
            ))}
        </dl>
      </div>
    ),
    "ls projects": () => (
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {groups.Projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => p.href && go(p.href)}
            className="text-left text-text hover:text-signal"
          >
            {p.href?.replace("/work/", "")}
          </button>
        ))}
      </div>
    ),
    "git log": () => (
      <ul className="space-y-1">
        {groups.Notes.slice(0, 6).map((n, i) => (
          <li key={n.id} className="flex gap-3">
            <span className="text-signal">{shortHash(n.id)}</span>
            {i === 0 && <span className="text-ok">(HEAD → main)</span>}
            <button
              type="button"
              onClick={() => n.href && go(n.href)}
              className="truncate text-left text-text hover:text-signal"
            >
              {n.title}
            </button>
          </li>
        ))}
        {groups.Notes.length === 0 && <li className="text-muted-foreground">no commits yet</li>}
      </ul>
    ),
    "kubectl get skills": () => (
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-line/40 text-muted-foreground">
              <th className="pb-1.5 font-normal tracking-wider">NAME</th>
              <th className="pb-1.5 font-normal tracking-wider">READY</th>
              <th className="pb-1.5 font-normal tracking-wider">STATUS</th>
            </tr>
          </thead>
          <tbody className="text-text">
            {profile.stackLayers.map((layer) => (
              <tr key={layer.id} className="border-b border-line/20 last:border-0">
                <td className="py-1 text-text">{layer.id}</td>
                <td className="py-1 text-muted-foreground">
                  {layer.tech.length}/{layer.tech.length}
                </td>
                <td className="py-1 text-ok">Running</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    "sudo hire-me": () => (
      <div className="space-y-1">
        <p className="text-muted-foreground">[sudo] password for visitor: ••••••••</p>
        <p className="text-ok">Access granted.</p>
        <p className="text-text">
          Press <Kbd>↵</Kbd> to open{" "}
          <button
            type="button"
            onClick={() => go("/contact")}
            className="text-signal hover:underline"
          >
            /contact
          </button>
        </p>
      </div>
    ),
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-2 px-2 text-muted-foreground hover:bg-surface-2 hover:text-text focus-visible:ring-1 focus-visible:ring-signal md:px-2.5"
        aria-label="Search"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden font-mono text-xs md:inline">Search</span>
        <span className="hidden md:inline">
          <Kbd>⌘K</Kbd>
        </span>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Command Palette"
        description="Search pages, projects, notes, and actions or type terminal commands"
        className="border border-line bg-surface p-0 shadow-2xl rounded-md! sm:max-w-xl!"
      >
        <Command
          className="flex flex-col bg-transparent text-text outline-none"
          loop
          onKeyDown={onKeyDown}
        >
          {/* Terminal window bar: one tab per section */}
          <div className="flex items-end gap-3 border-b border-line bg-surface-2/40 pt-2 pl-3.5">
            <div className="flex shrink-0 gap-1.5 pb-2.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-signal/70" />
            </div>
            <div
              role="tablist"
              aria-label="Sections"
              className="-mb-px flex min-w-0 overflow-x-auto [scrollbar-width:none]"
            >
              {TABS.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  tabIndex={-1}
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className="flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 border-transparent px-3 py-1.5 font-mono text-[0.6875rem] text-muted-foreground transition-colors hover:text-text aria-selected:border-line aria-selected:bg-surface aria-selected:text-text"
                >
                  <span className="text-line-strong">{i + 1}</span>
                  {tabPath(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt: the current tab is the working directory */}
          <div className="flex items-center border-b border-line px-3.5 py-2.5">
            <span className="mr-2.5 shrink-0 font-mono text-sm select-none" aria-hidden="true">
              <span className="text-muted-foreground">{tabPath(tab)}</span>{" "}
              <span className="font-semibold text-signal">&gt;</span>
            </span>
            <div className="relative flex min-w-0 flex-1">
              {/* completion hint: the typed text (invisible) followed by the rest of the first match */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden font-mono text-sm whitespace-pre"
              >
                <span className="invisible">{search}</span>
                <span className="text-muted-foreground/60">{ghost}</span>
              </div>
              <CommandPrimitive.Input
                value={search}
                onValueChange={(v) => {
                  stemRef.current = null;
                  setSearch(v);
                }}
                placeholder="Type a command or search..."
                className="relative flex h-7 w-full bg-transparent font-mono text-sm text-text placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
            </div>
            <Kbd>ESC</Kbd>
          </div>

          {/* Fake terminal response or command list */}
          {command ? (
            <div className="bg-surface-2/30 p-4 font-mono text-xs">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <span className="text-signal" aria-hidden="true">
                  &gt;
                </span>
                <span className="text-text">{trimmed}</span>
              </div>
              <div className="py-1">{output[command]()}</div>
              <div className="mt-4 flex items-center justify-between border-t border-line/30 pt-3 text-[0.6875rem] text-muted-foreground">
                <span>terminal output</span>
                <span>
                  Press <Kbd>ESC</Kbd> or backspace to return
                </span>
              </div>
            </div>
          ) : (
            <CommandList className="max-h-80 overflow-y-auto p-1.5">
              <CommandEmpty className="py-8 text-center font-mono text-xs text-muted-foreground">
                No matching results. Type <span className="text-signal">help</span> for commands
                {tab !== "all" && (
                  <>
                    , or press <Kbd>Tab</Kbd> for other sections
                  </>
                )}
                .
              </CommandEmpty>

              {(["Pages", "Projects", "Notes"] as const).map(
                (g) =>
                  shown(g) && (
                    <CommandGroup key={g} heading={g} className={headingClass}>
                      {groups[g].map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${item.title} ${item.href || ""}`}
                          keywords={[g.toLowerCase()]}
                          onSelect={() => handleSelect(item)}
                          className={itemClass}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{item.title}</span>
                            {item.mock !== undefined && <SampleBadge mock={item.mock} />}
                          </div>
                          {item.href && <span className={metaClass}>{item.href}</span>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ),
              )}

              {shown("Actions") && (
                <CommandGroup heading="Actions" className={headingClass}>
                  {groups.Actions.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.email || ""}`}
                      onSelect={() => handleSelect(item)}
                      className={itemClass}
                    >
                      <span className="truncate">{item.title}</span>
                      {item.actionId === "copy-email" && item.email && (
                        <span className={metaClass}>{item.email}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          )}

          {/* Dialog footer with shortcuts */}
          <div className="flex items-center justify-between border-t border-line px-3.5 py-2 font-mono text-[0.6875rem] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Navigate <Kbd>↑</Kbd> <Kbd>↓</Kbd>
              </span>
              <span>
                Select <Kbd>↵</Kbd>
              </span>
              <span className="hidden sm:inline">
                Complete / tabs <Kbd>Tab</Kbd>
              </span>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <span>Try</span>
              <button
                type="button"
                onClick={() => setSearch("help")}
                className="text-signal hover:underline"
              >
                help
              </button>
              <span>or</span>
              <button
                type="button"
                onClick={() => setSearch("neofetch")}
                className="text-signal hover:underline"
              >
                neofetch
              </button>
            </div>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
