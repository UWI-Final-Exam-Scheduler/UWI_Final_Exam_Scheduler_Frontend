import { useDraggable } from "@dnd-kit/core";
import CustomCard from "./CustomCard";
import { Exam } from "../types/calendarTypes";

export default function ExamCardDnD({ exam }: { exam: Exam }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(exam.id),
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <CustomCard>{exam.courseCode}</CustomCard>
    </div>
  );
}
