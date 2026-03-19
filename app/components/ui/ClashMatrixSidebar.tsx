import CustomButton from "./CustomButton";
import { Spinner } from "@radix-ui/themes";

export default function ClashMatrixSidebar({
  percentageThreshold = 10,
  absoluteThreshold = "5",
  onPercentageChange,
  onAbsoluteChange,
  onApply,
  clashCount,
  totalCourses = 0,
}: {
  percentageThreshold?: number;
  absoluteThreshold?: string;
  onPercentageChange?: (value: number) => void;
  onAbsoluteChange?: (value: string) => void;
  onApply?: () => void;
  clashCount?: number;
  totalCourses?: number;
}) {
  return (
    <aside className="w-80 flex flex-col border rounded-lg bg-white py-6 px-6 mr-6 h-[400px]">
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-center">Clash Metrics</h2>
        <div className="mb-8">
          <label className="block mb-2 font-semibold">
            Percentage Threshold: {percentageThreshold}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={percentageThreshold}
            onChange={(e) => onPercentageChange?.(Number(e.target.value))}
            className="w-full blue cursor-pointer"
          />
        </div>
        <div className="mb-8">
          <label className="block mb-2 font-semibold">Absolute Threshold</label>
          <input
            type="number"
            value={absoluteThreshold}
            onChange={(e) => onAbsoluteChange?.(e.target.value)}
            className="w-full border rounded px-2 py-1 cursor-pointer"
          />
        </div>
        <div className="flex flex-col gap-1 mb-4 text-left pl-1">
          <span className="text-orange-600 font-semibold flex items-center gap-2">
            Courses with Clashes:
            {clashCount === undefined ? (
              <Spinner className="inline-block align-middle" />
            ) : (
              <span>{clashCount}</span>
            )}
          </span>
          <span className="text-gray-700 font-semibold">
            Total Courses: {totalCourses}
          </span>
        </div>
      </div>
      <div className="flex justify-center mt-0">
        <CustomButton
          buttonname="Apply Thresholds"
          onclick={onApply}
          className="w-full max-w-xs cursor-pointer"
        />
      </div>
    </aside>
  );
}
