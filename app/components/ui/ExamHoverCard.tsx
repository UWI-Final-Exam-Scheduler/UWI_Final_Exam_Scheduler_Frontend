import { HoverCard } from "radix-ui";
import { Exam } from "../types/calendarTypes";

type ExamHoverCardProps = {
  clash: "sameday" | "adjacent";
  examClashes: Exam[];
  children: React.ReactNode;
};

export default function ExamHoverCard({
  clash,
  examClashes,
  children,
}: ExamHoverCardProps) {
  // Label and accent colour match the existing card colour coding.
  const label =
    clash === "sameday" ? "Same-Day Clashes" : "Adjacent-Day Clashes";
  const badgeColor = clash === "sameday" ? "#f01f88" : "orange"; // hotpink / orange

  return (
    <HoverCard.Root
      openDelay={500}
      closeDelay={200} // short delay so it doesn't vanish instantly
    >
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          align="start"
          sideOffset={6}
          className="
            z-50 rounded-lg border border-gray-200 bg-white shadow-md p-2
            max-w-[180px] max-h-[160px] overflow-y-auto
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
            {examClashes.map((e) => (
              <li
                key={e.id}
                className="flex justify-between gap-2 text-xs bg-gray-100 rounded px-1.5 py-0.5"
              >
                <span className="font-medium text-gray-800 truncate">
                  {e.courseCode}
                </span>
                <span className="text-gray-600 shrink-0">
                  {e.number_of_students}
                </span>
              </li>
            ))}
          </ul>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
