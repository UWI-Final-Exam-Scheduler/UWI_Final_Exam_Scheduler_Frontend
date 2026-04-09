import { useDraggable } from "@dnd-kit/core";
import { Exam, ClashDetail } from "../types/calendarTypes";
import { Card, Flex, Text } from "@radix-ui/themes";
import ExamActionMenu from "./ExamActionsMenu";
import ExamHoverCard from "./ExamHoverCard";

type ExamCardProps = {
  exam: Exam;
  dragId?: string;
  allExams?: Exam[];
  isReschedule?: boolean;
  onSplitExam?: (exam: Exam) => void;
  onMergeExam?: (exam: Exam) => void;
  clashColor?: "orange" | "hotpink" | "red";
  clashDetail?: ClashDetail;
};

export default function ExamCardDnD({
  exam,
  dragId,
  allExams = [],
  isReschedule,
  onSplitExam,
  onMergeExam,
  clashColor,
  clashDetail,
}: ExamCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: dragId ?? String(exam.id),
      data: { exam },
    });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        opacity: isDragging ? 0 : 1,
      }
    : isDragging
      ? { opacity: 0 }
      : undefined;

  const hasSplits =
    allExams.filter((e) => e.courseCode === exam.courseCode).length > 1;
  const splitsForCourse = allExams
    .filter((e) => e.courseCode === exam.courseCode)
    .sort((a, b) => a.id - b.id);
  const splitIndex = splitsForCourse.findIndex((e) => e.id === exam.id) + 1;
  const splitTotal = splitsForCourse.length;

  const card = (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="cursor-pointer"
    >
      <Card
        variant="surface"
        className="h-7"
        style={clashColor ? { backgroundColor: clashColor } : undefined}
      >
        <Flex align="center" justify="between" className="w-full gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <Text size="1" weight="bold" className="truncate">
              {exam.courseCode}
            </Text>
            {hasSplits && splitIndex > 0 && (
              <span
                className={`${isReschedule ? "text-[9px]" : "text-[10px]"} font-bold text-gray-600 whitespace-nowrap`}
              >
                Split:{splitIndex}/{splitTotal}
              </span>
            )}
          </div>
          <Text size="1" weight="medium" className="shrink-0">
            {exam.number_of_students}
          </Text>
        </Flex>
      </Card>
    </div>
  );

  if (isReschedule) {
    return (
      <ExamActionMenu
        exam={exam}
        hasSplits={hasSplits}
        onSplitExam={() => onSplitExam?.(exam)}
        onMergeExam={() => onMergeExam?.(exam)}
      >
        {card}
      </ExamActionMenu>
    );
  }

  const cardWithHover = clashDetail ? (
    <ExamHoverCard clashDetail={clashDetail}>{card}</ExamHoverCard>
  ) : (
    card
  );

  return (
    <ExamActionMenu
      exam={exam}
      hasSplits={hasSplits}
      onSplitExam={() => onSplitExam?.(exam)}
      onMergeExam={() => onMergeExam?.(exam)}
    >
      {cardWithHover}
    </ExamActionMenu>
  );
}
