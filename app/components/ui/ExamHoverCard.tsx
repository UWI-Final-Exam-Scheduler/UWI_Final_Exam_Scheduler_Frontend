import { HoverCard } from "radix-ui";
import { ClashDetail } from "../types/calendarTypes";

type ExamHoverCardProps = {
  clashDetail: ClashDetail;
  children: React.ReactNode;
};

export default function ExamHoverCard({
  clashDetail,
  children,
}: ExamHoverCardProps) {
  const { clash, clashExams } = clashDetail;

  const label =
    clash === "same-day-time"
      ? "Same Time & Day Clash"
      : clash === "sameday"
        ? "Same-Day Clash"
        : "Adjacent-Day Clash";

  const badgeColor =
    clash === "same-day-time"
      ? "#dc2626" // red
      : clash === "sameday"
        ? "#f01f88" // hotpink
        : "orange";

  return (
    <HoverCard.Root openDelay={500} closeDelay={200}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          align="start"
          sideOffset={6}
          className="
            z-50 rounded-lg border border-gray-200 bg-white shadow-md p-2
            max-w-[200px] max-h-[160px] overflow-y-auto
          "
        >
          <HoverCard.Arrow className="fill-gray-200" />
          <div
            className="text-[10px] font-semibold rounded px-1 py-0.5 mb-1.5 inline-block text-white"
            style={{ backgroundColor: badgeColor }}
          >
            {label}
          </div>
          <ul className="flex flex-col gap-1">
            {clashExams.map(({ exam: e, studentsAffected }) => (
              <li
                key={e.id}
                className="flex justify-between gap-2 text-xs bg-gray-100 rounded px-1.5 py-0.5"
              >
                <span className="font-medium text-gray-800 truncate">
                  {e.courseCode}
                </span>
                <span className="text-gray-600 shrink-0">
                  {studentsAffected} affected
                </span>
              </li>
            ))}
          </ul>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
