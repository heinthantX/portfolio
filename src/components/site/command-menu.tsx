"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
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
import type { CommandMenuItem } from "./command-menu-data";

interface CommandMenuProps {
  items: CommandMenuItem[];
}

export function CommandMenu({ items }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  // Keyboard shortcut listener: ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    }
  };

  const handleSelect = (item: CommandMenuItem) => {
    handleOpenChange(false);

    if (item.href) {
      router.push(item.href);
      return;
    }

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

  // Grouped items
  const pages = useMemo(() => items.filter((i) => i.group === "Pages"), [items]);
  const projects = useMemo(() => items.filter((i) => i.group === "Projects"), [items]);
  const notes = useMemo(() => items.filter((i) => i.group === "Notes"), [items]);
  const actions = useMemo(() => items.filter((i) => i.group === "Actions"), [items]);

  // Project slugs for the 'ls projects' easter-egg
  const projectSlugs = useMemo(
    () =>
      projects
        .map((p) => p.href?.replace("/work/", ""))
        .filter((slug): slug is string => Boolean(slug)),
    [projects],
  );

  // Easter eggs exact matching
  const trimmed = search.trim().toLowerCase();
  const isWhoami = trimmed === "whoami";
  const isLsProjects = trimmed === "ls projects";
  const isKubectl = trimmed === "kubectl get skills";
  const isEasterEgg = isWhoami || isLsProjects || isKubectl;

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
        <Command className="flex flex-col bg-transparent text-text outline-none" loop>
          {/* Terminal-style input with '>' prefix */}
          <div className="flex items-center border-b border-line px-3.5 py-2.5">
            <span
              className="mr-2.5 font-mono text-sm font-semibold text-signal select-none"
              aria-hidden="true"
            >
              &gt;
            </span>
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex h-7 w-full bg-transparent font-mono text-sm text-text placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            <Kbd>ESC</Kbd>
          </div>

          {/* Fake terminal response or command list */}
          {isEasterEgg ? (
            <div className="p-4 font-mono text-xs bg-surface-2/30">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <span className="text-signal" aria-hidden="true">
                  &gt;
                </span>
                <span className="text-text">{search.trim()}</span>
              </div>
              <div className="py-1">
                {isWhoami && (
                  <p className="text-signal-strong font-mono">
                    {profile.name} — {profile.title}
                  </p>
                )}
                {isLsProjects && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    {projectSlugs.map((slug) => (
                      <span key={slug} className="text-text font-mono">
                        {slug}
                      </span>
                    ))}
                  </div>
                )}
                {isKubectl && (
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
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-line/30 flex items-center justify-between text-[0.6875rem] text-muted-foreground">
                <span>terminal output</span>
                <span>
                  Press <Kbd>ESC</Kbd> or backspace to return
                </span>
              </div>
            </div>
          ) : (
            <CommandList className="max-h-80 overflow-y-auto p-1.5">
              <CommandEmpty className="py-8 text-center font-mono text-xs text-muted-foreground">
                No matching results. Try <span className="text-signal">whoami</span>,{" "}
                <span className="text-signal">ls projects</span>, or{" "}
                <span className="text-signal">kubectl get skills</span>.
              </CommandEmpty>

              {pages.length > 0 && (
                <CommandGroup
                  heading="Pages"
                  className="**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[0.6875rem] **:[[cmdk-group-heading]]:tracking-[0.12em] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground"
                >
                  {pages.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.href || ""}`}
                      keywords={["pages"]}
                      onSelect={() => handleSelect(item)}
                      className="flex cursor-pointer items-center justify-between font-mono text-xs text-text hover:bg-surface-2 data-selected:bg-surface-2 data-selected:text-signal"
                    >
                      <span className="truncate">{item.title}</span>
                      {item.href && (
                        <span className="shrink-0 text-[0.6875rem] text-muted-foreground group-data-selected/command-item:text-text">
                          {item.href}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {projects.length > 0 && (
                <CommandGroup
                  heading="Projects"
                  className="**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[0.6875rem] **:[[cmdk-group-heading]]:tracking-[0.12em] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground"
                >
                  {projects.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.href || ""}`}
                      keywords={["projects"]}
                      onSelect={() => handleSelect(item)}
                      className="flex cursor-pointer items-center justify-between font-mono text-xs text-text hover:bg-surface-2 data-selected:bg-surface-2 data-selected:text-signal"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{item.title}</span>
                        {item.mock !== undefined && <SampleBadge mock={item.mock} />}
                      </div>
                      {item.href && (
                        <span className="shrink-0 text-[0.6875rem] text-muted-foreground group-data-selected/command-item:text-text">
                          {item.href}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {notes.length > 0 && (
                <CommandGroup
                  heading="Notes"
                  className="**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[0.6875rem] **:[[cmdk-group-heading]]:tracking-[0.12em] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground"
                >
                  {notes.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.href || ""}`}
                      keywords={["notes"]}
                      onSelect={() => handleSelect(item)}
                      className="flex cursor-pointer items-center justify-between font-mono text-xs text-text hover:bg-surface-2 data-selected:bg-surface-2 data-selected:text-signal"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{item.title}</span>
                        {item.mock !== undefined && <SampleBadge mock={item.mock} />}
                      </div>
                      {item.href && (
                        <span className="shrink-0 text-[0.6875rem] text-muted-foreground group-data-selected/command-item:text-text">
                          {item.href}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {actions.length > 0 && (
                <CommandGroup
                  heading="Actions"
                  className="**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[0.6875rem] **:[[cmdk-group-heading]]:tracking-[0.12em] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground"
                >
                  {actions.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.email || ""}`}
                      onSelect={() => handleSelect(item)}
                      className="flex cursor-pointer items-center justify-between font-mono text-xs text-text hover:bg-surface-2 data-selected:bg-surface-2 data-selected:text-signal"
                    >
                      <span className="truncate">{item.title}</span>
                      {item.actionId === "copy-email" && item.email && (
                        <span className="shrink-0 text-[0.6875rem] text-muted-foreground group-data-selected/command-item:text-text">
                          {item.email}
                        </span>
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
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span>Try</span>
              <span className="text-signal">whoami</span>
              <span>or</span>
              <span className="text-signal">kubectl get skills</span>
            </div>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
