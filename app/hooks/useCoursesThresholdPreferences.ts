import { useEffect } from "react";
import { useThresholds } from "@/app/hooks/useThresholds";
import {
  useUserPreferences,
  useUpdateUserPreferences,
} from "@/app/hooks/usePreference";
import toast from "react-hot-toast"
import { addLog } from "@/app/lib/activityLog"

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
    const oldPercentage = percentageThreshold;
    const oldAbsolute = Number(absoluteThreshold);
    const newPercentage = inputPercentageThreshold;
    const newAbsolute = Number(inputAbsoluteThreshold);

    handleApplyThresholds();
    onThresholdsApplied?.();

    let hasChanged = false;

    if(oldPercentage !== newPercentage) {
      addLog({
        action: "Percentage Threshold Changed",
        entityId: "Percentage Threshold",
        oldValue: oldPercentage,
        newValue: newPercentage,
      });

      toast.success(`Percentage threshold updated to ${newPercentage}%`);
      hasChanged = true;
    }

    if(oldAbsolute !== newAbsolute) {
      addLog({
        action: "Absolute Threshold Changed",
        entityId: "Absolute Threshold",
        oldValue: oldAbsolute,
        newValue: newAbsolute,
      });

      toast.success(`Absolute threshold updated to ${newAbsolute}`);
      hasChanged = true;
    }

    if(!hasChanged) {
      toast("No Changes Applied");
    }
    
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
