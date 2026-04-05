import { useDraggable } from "@dnd-kit/core";
import { Exam, ClashDetail } from "../types/calendarTypes";
import { Card, Flex, Text } from "@radix-ui/themes";
import ExamActionMenu from "./ExamActionsMenu";
import ExamHoverCard from "./ExamHoverCard";

type ExamCardProps = {
  exam: Exam;
  allExams?: Exam[];
  isReschedule?: boolean;
  onSplitExam?: (exam: Exam) => void;
  onMergeExam?: (exam: Exam) => void;
  clashColor?: "orange" | "hotpink";
  clashDetail?: ClashDetail;
};

export default function ExamCardDnD({
  exam,
  allExams = [],
  isReschedule,
  onSplitExam,
  onMergeExam,
  clashColor,
  clashDetail,
}: ExamCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(exam.id),
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const hasSplits =
    allExams.filter((e) => e.courseCode === exam.courseCode).length > 1;

  const card = (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <Card
        variant="surface"
        className="h-7"
        style={clashColor ? { backgroundColor: clashColor } : undefined}
      >
        <Flex align="center" justify="between">
          <Text size="1" weight="bold">
            {exam.courseCode}
          </Text>
          <Text size="1" weight="medium">
            {exam.number_of_students}
          </Text>
        </Flex>
      </Card>
    </div>
  );

  if (isReschedule) return card; // no hover card or action menu during rescheduling

  const cardWithHover = clashDetail ? (
    <ExamHoverCard clash={clashDetail.clash} examClashes={clashDetail.exams}>
      {card}
    </ExamHoverCard>
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
