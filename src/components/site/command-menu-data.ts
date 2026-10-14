import { nav } from "@/components/site/nav";
import { profile } from "@/content/profile";
import { notes, work } from "@/lib/content";

export type CommandMenuCategory = "Pages" | "Projects" | "Notes" | "Actions";

export interface CommandMenuItem {
  id: string;
  title: string;
  group: CommandMenuCategory;
  href?: string;
  actionId?: "toggle-theme" | "copy-email";
  email?: string;
  mock?: boolean;
}

export function getCommandMenuItems(): CommandMenuItem[] {
  const pages: CommandMenuItem[] = [
    {
      id: "page-home",
      title: "Home",
      group: "Pages",
      href: "/",
    },
    ...nav.map((item) => ({
      id: `page-${item.href.replace("/", "")}`,
      title: item.label,
      group: "Pages" as const,
      href: item.href,
    })),
  ];

  const projects: CommandMenuItem[] = work.map((project) => ({
    id: `project-${project.slug}`,
    title: project.title,
    group: "Projects",
    href: `/work/${project.slug}`,
    mock: project.mock,
  }));

  const noteItems: CommandMenuItem[] = notes.map((note) => ({
    id: `note-${note.slug}`,
    title: note.title,
    group: "Notes",
    href: `/notes/${note.slug}`,
    mock: note.mock,
  }));

  const actions: CommandMenuItem[] = [
    {
      id: "action-toggle-theme",
      title: "Toggle theme",
      group: "Actions",
      actionId: "toggle-theme",
    },
    {
      id: "action-copy-email",
      title: "Copy email",
      group: "Actions",
      actionId: "copy-email",
      email: profile.contact.email,
    },
  ];

  return [...pages, ...projects, ...noteItems, ...actions];
}

export const commandMenuItems = getCommandMenuItems();
