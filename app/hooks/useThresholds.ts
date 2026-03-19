import { useThresholdStates } from "@/app/state_management/thresholdStates";
import { useState, useEffect } from "react";

export function useThresholds() {
  const {
    percentageThreshold,
    absoluteThreshold,
    setPercentageThreshold,
    setAbsoluteThreshold,
  } = useThresholdStates();

  // Local state for sidebar input
  const [inputPercentageThreshold, setInputPercentageThreshold] =
    useState(percentageThreshold);
  const [inputAbsoluteThreshold, setInputAbsoluteThreshold] =
    useState(absoluteThreshold);

  // Sync input fields with global state when it changes (i.e current Zustand state)
  useEffect(() => {
    setInputPercentageThreshold(percentageThreshold);
  }, [percentageThreshold]);

  useEffect(() => {
    setInputAbsoluteThreshold(absoluteThreshold);
  }, [absoluteThreshold]);

  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleApplyThresholds = () => {
    setPercentageThreshold(Number(inputPercentageThreshold) || 0);
    setAbsoluteThreshold(inputAbsoluteThreshold);
    setAlertMsg("Thresholds applied successfully!");
    setTimeout(() => setAlertMsg(null), 2000);
  };

  return {
    inputPercentageThreshold,
    setInputPercentageThreshold,
    inputAbsoluteThreshold,
    setInputAbsoluteThreshold,
    percentageThreshold,
    absoluteThreshold,
    setPercentageThreshold,
    setAbsoluteThreshold,
    handleApplyThresholds,
    alertMsg,
  };
}
