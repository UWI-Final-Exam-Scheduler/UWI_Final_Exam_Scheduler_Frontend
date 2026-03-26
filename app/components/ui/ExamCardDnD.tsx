import { useDraggable } from "@dnd-kit/core";
import { Exam } from "../types/calendarTypes";
import { Card, Flex, Text } from "@radix-ui/themes";

export default function ExamCardDnD({ exam }: { exam: Exam }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(exam.id),
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      {/* <CustomCard className="h-2">{exam.courseCode}</CustomCard> */}
      <Card variant="surface" className="h-7">
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
}
