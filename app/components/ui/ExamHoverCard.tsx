import { HoverCard } from "radix-ui";
import { Exam } from "../types/calendarTypes";

type ExamHoverCardProps = {
  clash: "sameday" | "adjacent";
  examClashes: Exam[];
};

export default function ExamHoverCard({
  clash,
  examClashes,
}: ExamHoverCardProps) {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger />
      <HoverCard.Portal>
        <HoverCard.Content>
          <HoverCard.Arrow />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
