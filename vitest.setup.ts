import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(
      (): MediaQueryList => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    ),
  });
}
class TestResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver =
  TestResizeObserver as unknown as typeof ResizeObserver;
HTMLElement.prototype.scrollIntoView = vi.fn();
