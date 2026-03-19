import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThresholdState = {
  percentageThreshold: number;
  absoluteThreshold: string;
  setPercentageThreshold: (val: number) => void;
  setAbsoluteThreshold: (val: string) => void;
};

export const useThresholdStates = create<ThresholdState>()(
  persist(
    (set) => ({
      percentageThreshold: 10,
      absoluteThreshold: "5",
      setPercentageThreshold: (val) => set({ percentageThreshold: val }),
      setAbsoluteThreshold: (val) => set({ absoluteThreshold: val }),
    }),
    {
      name: "threshold-storage", // key in localStorage
    },
  ),
);
