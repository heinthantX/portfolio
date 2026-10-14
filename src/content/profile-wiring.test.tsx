import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResumePage from "@/app/resume/page";
import { SiteFooter } from "@/components/site/site-footer";
import { profile } from "@/content/profile";

vi.mock("@/content/profile", async () => {
  const actual = await vi.importActual<typeof import("@/content/profile")>("@/content/profile");
  return {
    ...actual,
    profile: {
      ...actual.profile,
      title: "Test Title XYZ",
    },
  };
});

describe("profile wiring", () => {
  it("proves changing profile changes the output in résumé and site footer", () => {
    const { unmount } = render(<ResumePage />);
    expect(screen.getByText("Test Title XYZ")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: profile.name, level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("Full-Stack & DevOps Engineer")).not.toBeInTheDocument();
    unmount();

    render(<SiteFooter />);
    expect(screen.getAllByText(profile.name).length).toBeGreaterThan(0);
  });
});
