import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Cursor } from "./cursor";

function setupMatchMedia({
  pointerFine = true,
  reducedMotion = false,
}: {
  pointerFine?: boolean;
  reducedMotion?: boolean;
} = {}) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      let matches = false;
      if (query.includes("pointer: fine")) {
        matches = pointerFine;
      } else if (query.includes("pointer: coarse")) {
        matches = !pointerFine;
      } else if (query.includes("prefers-reduced-motion: reduce")) {
        matches = reducedMotion;
      }

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
}

describe("Cursor", () => {
  beforeEach(() => {
    document.documentElement.className = "";
  });

  afterEach(() => {
    cleanup();
    document.documentElement.className = "";
    vi.restoreAllMocks();
  });

  it("with matchMedia mocked to pointer:coarse it renders nothing", () => {
    setupMatchMedia({ pointerFine: false, reducedMotion: false });

    const { container } = render(<Cursor />);
    expect(container.firstChild).toBeNull();
    expect(document.documentElement.classList.contains("has-cursor")).toBe(false);
  });

  it("with prefers-reduced-motion: reduce it renders nothing even on fine pointer", () => {
    setupMatchMedia({ pointerFine: true, reducedMotion: true });

    const { container } = render(<Cursor />);
    expect(container.firstChild).toBeNull();
    expect(document.documentElement.classList.contains("has-cursor")).toBe(false);
  });

  it("with pointer:fine it renders the two aria-hidden elements after mount", () => {
    setupMatchMedia({ pointerFine: true, reducedMotion: false });

    const { container, unmount } = render(<Cursor />);
    const elements = container.querySelectorAll('[aria-hidden="true"]');
    expect(elements).toHaveLength(2);
    expect(document.documentElement.classList.contains("has-cursor")).toBe(true);

    unmount();
    expect(document.documentElement.classList.contains("has-cursor")).toBe(false);
  });

  it("shows elements on first pointer move and positions them", () => {
    setupMatchMedia({ pointerFine: true, reducedMotion: false });

    const { container } = render(<Cursor />);
    const [dot, ring] = Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"]'));

    expect(dot.style.opacity).toBe("0");
    expect(ring.style.opacity).toBe("0");

    fireEvent.pointerMove(window, { clientX: 120, clientY: 240 });

    expect(dot.style.opacity).toBe("1");
    expect(ring.style.opacity).toBe("1");
    expect(dot.style.transform).toContain("translate3d(120px, 240px, 0)");

    fireEvent(document.documentElement, new Event("pointerleave"));
    expect(dot.style.opacity).toBe("0");
    expect(ring.style.opacity).toBe("0");
  });

  it("scales ring and adds bg-signal/10 when hovering interactive elements", () => {
    setupMatchMedia({ pointerFine: true, reducedMotion: false });

    const { container } = render(
      <div>
        <button type="button" data-testid="test-btn">
          Click me
        </button>
        <Cursor />
      </div>,
    );

    const ring = container.querySelectorAll<HTMLElement>('[aria-hidden="true"]')[1];
    const button = container.querySelector('[data-testid="test-btn"]');
    expect(button).not.toBeNull();
    if (!button || !ring) throw new Error("Elements not found");

    fireEvent.pointerMove(window, { clientX: 50, clientY: 50 });
    fireEvent.pointerOver(button);

    expect(ring.classList.contains("bg-signal/10")).toBe(true);
    expect(ring.style.transform).toContain("scale(1.8)");
  });

  it("grows ring to 64px and displays label text centered when hovering data-cursor", () => {
    setupMatchMedia({ pointerFine: true, reducedMotion: false });

    const { container } = render(
      <div>
        <a href="/work/demo" data-cursor="View" data-testid="work-link">
          Project
        </a>
        <Cursor />
      </div>,
    );

    const ring = container.querySelectorAll<HTMLElement>('[aria-hidden="true"]')[1];
    const link = container.querySelector('[data-testid="work-link"]');
    expect(link).not.toBeNull();
    if (!link || !ring) throw new Error("Elements not found");

    fireEvent.pointerMove(window, { clientX: 80, clientY: 80 });
    fireEvent.pointerOver(link);

    expect(ring.style.width).toBe("64px");
    expect(ring.style.height).toBe("64px");
    expect(ring.classList.contains("bg-signal/10")).toBe(true);
    expect(ring.textContent).toContain("View");
  });

  it("hides custom cursor when hovering inputs", () => {
    setupMatchMedia({ pointerFine: true, reducedMotion: false });

    const { container } = render(
      <div>
        <input type="text" data-testid="test-input" />
        <Cursor />
      </div>,
    );

    const [dot, ring] = Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"]'));
    const input = container.querySelector('[data-testid="test-input"]');
    expect(input).not.toBeNull();
    if (!input || !dot || !ring) throw new Error("Elements not found");

    fireEvent.pointerMove(window, { clientX: 100, clientY: 100 });
    expect(dot.style.opacity).toBe("1");
    expect(ring.style.opacity).toBe("1");

    fireEvent.pointerOver(input);
    expect(dot.style.opacity).toBe("0");
    expect(ring.style.opacity).toBe("0");
  });

  it("scales ring down to 0.8 briefly on pointerdown", () => {
    setupMatchMedia({ pointerFine: true, reducedMotion: false });

    const { container } = render(<Cursor />);
    const ring = container.querySelectorAll<HTMLElement>('[aria-hidden="true"]')[1];

    fireEvent.pointerMove(window, { clientX: 100, clientY: 100 });
    fireEvent.pointerDown(window);

    expect(ring.style.transform).toContain("scale(0.8)");
  });

  it("pulls magnetic elements toward pointer up to 6px and springs back on leave", () => {
    setupMatchMedia({ pointerFine: true, reducedMotion: false });

    const { container } = render(
      <div>
        <button type="button" data-magnetic data-testid="magnetic-btn">
          Action
        </button>
        <Cursor />
      </div>,
    );

    const btn = container.querySelector<HTMLElement>('[data-testid="magnetic-btn"]');
    expect(btn).not.toBeNull();
    if (!btn) throw new Error("Button not found");

    btn.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 100,
      height: 40,
      right: 200,
      bottom: 140,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Pointer move at center: deltaX = 0, deltaY = 0
    fireEvent.pointerMove(btn, { clientX: 150, clientY: 120 });
    expect(btn.style.transform).toBe("translate3d(0.00px, 0.00px, 0)");

    // Pointer move at far right edge (clientX = 200 -> deltaX = 50 / 50 * 6 = 6px)
    fireEvent.pointerMove(btn, { clientX: 200, clientY: 120 });
    expect(btn.style.transform).toBe("translate3d(6.00px, 0.00px, 0)");

    // Moving pointer away resets button with 300ms transition
    fireEvent.pointerMove(document.body, { clientX: 300, clientY: 300 });
    expect(btn.style.transition).toBe("transform 300ms");
    expect(btn.style.transform).toBe("translate3d(0px, 0px, 0px)");
  });
});
