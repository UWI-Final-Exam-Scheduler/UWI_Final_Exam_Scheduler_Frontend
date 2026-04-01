import { useEffect } from "react";
import { useThresholds } from "@/app/hooks/useThresholds";
import {
  useUserPreferences,
  useUpdateUserPreferences,
} from "@/app/hooks/usePreference";

type UseCoursesThresholdPreferencesArgs = {
  onThresholdsApplied?: () => void;
};

export function useCoursesThresholdPreferences({
  onThresholdsApplied,
}: UseCoursesThresholdPreferencesArgs = {}) {
  const {
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
  } = useThresholds();

  const { data: userPreferences } = useUserPreferences();
  const updateUserPreferences = useUpdateUserPreferences();

  useEffect(() => {
    if (!userPreferences) return;

    const savedPercentage = userPreferences.perc_threshold * 100;
    const savedAbsolute = String(userPreferences.abs_threshold);

    setInputPercentageThreshold(savedPercentage);
    setInputAbsoluteThreshold(savedAbsolute);
    setPercentageThreshold(savedPercentage);
    setAbsoluteThreshold(savedAbsolute);
  }, [
    userPreferences,
    setInputPercentageThreshold,
    setInputAbsoluteThreshold,
    setPercentageThreshold,
    setAbsoluteThreshold,
  ]);

  async function handleApplyAndSaveThresholds() {
    handleApplyThresholds();
    onThresholdsApplied?.();

    try {
      await updateUserPreferences.mutateAsync({
        abs_threshold: Number(inputAbsoluteThreshold) || 0,
        perc_threshold: (Number(inputPercentageThreshold) || 0) / 100,
      });
    } catch (saveError) {
      console.error("Failed to save user preferences", saveError);
    }
  }

  return {
    inputPercentageThreshold,
    setInputPercentageThreshold,
    inputAbsoluteThreshold,
    setInputAbsoluteThreshold,
    percentageThreshold,
    absoluteThreshold,
    alertMsg,
    handleApplyAndSaveThresholds,
  };
}
