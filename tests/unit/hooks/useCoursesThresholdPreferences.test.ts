import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

// Mock activity log
vi.mock("@/app/lib/activityLog", () => ({
  addLog: vi.fn(),
}));

// Mock all threshold dependencies
vi.mock("@/app/hooks/useThresholds", () => ({
  useThresholds: () => ({
    inputPercentageThreshold: 10,
    setInputPercentageThreshold: vi.fn(),
    inputAbsoluteThreshold: "5",
    setInputAbsoluteThreshold: vi.fn(),
    percentageThreshold: 0, // old value
    absoluteThreshold: "0", // old value
    setPercentageThreshold: vi.fn(),
    setAbsoluteThreshold: vi.fn(),
    handleApplyThresholds: vi.fn(),
    alertMsg: "",
  }),
}));

vi.mock("@/app/hooks/usePreference", () => ({
  useUserPreferences: () => ({ data: null }),
  useUpdateUserPreferences: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  }),
}));

import toast from "react-hot-toast";
import { useCoursesThresholdPreferences } from "@/app/hooks/useCoursesThresholdPreferences";

describe("useCoursesThresholdPreferences & toast notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show success toast when percentage threshold changes", async () => {
    const { result } = renderHook(() => useCoursesThresholdPreferences());

    await act(async () => {
      await result.current.handleApplyAndSaveThresholds();
    });

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Percentage threshold updated to"),
    );
  });

  it("should show success toast when absolute threshold changes", async () => {
    const { result } = renderHook(() => useCoursesThresholdPreferences());

    await act(async () => {
      await result.current.handleApplyAndSaveThresholds();
    });

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Absolute threshold updated to"),
    );
  });

  it("should call onThresholdsApplied callback when provided", async () => {
    const onThresholdsApplied = vi.fn();
    const { result } = renderHook(() =>
      useCoursesThresholdPreferences({ onThresholdsApplied }),
    );

    await act(async () => {
      await result.current.handleApplyAndSaveThresholds();
    });

    expect(onThresholdsApplied).toHaveBeenCalled();
  });
});
