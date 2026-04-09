// app/state_management/examStore.ts
import { Dispatch, SetStateAction } from "react";
import { create } from "zustand";
import { Exam } from "../components/types/calendarTypes";

type SetExams = Dispatch<SetStateAction<Exam[]>>;

type ExamSnapshot = {
  exams: Exam[];
  rescheduleExams: Exam[];
  allScheduledExams: Exam[];
};

type ExamStore = ExamSnapshot & {
  setExams: SetExams;
  setRescheduleExams: SetExams;
  setAllScheduledExams: SetExams;
  optimisticMoveToReschedule: (courseCode: string) => {
    snapshot: ExamSnapshot;
    movedExams: Exam[];
  };
  restoreSnapshot: (snapshot: ExamSnapshot) => void;
};

function applyUpdate(prev: Exam[], update: SetStateAction<Exam[]>): Exam[] {
  return typeof update === "function" ? update(prev) : update;
}

export const useExamStore = create<ExamStore>((set, get) => ({
  exams: [],
  rescheduleExams: [],
  allScheduledExams: [],

  setExams: (update) => set((s) => ({ exams: applyUpdate(s.exams, update) })),

  setRescheduleExams: (update) =>
    set((s) => ({ rescheduleExams: applyUpdate(s.rescheduleExams, update) })),

  setAllScheduledExams: (update) =>
    set((s) => ({
      allScheduledExams: applyUpdate(s.allScheduledExams, update),
    })),

  optimisticMoveToReschedule: (courseCode) => {
    const { exams, allScheduledExams, rescheduleExams } = get();

    const snapshot: ExamSnapshot = {
      exams: [...exams],
      rescheduleExams: [...rescheduleExams],
      allScheduledExams: [...allScheduledExams],
    };

    // collects aLL scheduled splits of this course across every date,
    const seenIds = new Set<number>();
    const movedExams: Exam[] = [];
    [...exams, ...allScheduledExams].forEach((e) => {
      if (e.courseCode === courseCode && !seenIds.has(e.id)) {
        seenIds.add(e.id);
        movedExams.push(e);
      }
    });

    const movedIds = new Set(movedExams.map((e) => e.id));

    set({
      exams: exams.filter((e) => !movedIds.has(e.id)),
      allScheduledExams: allScheduledExams.filter((e) => !movedIds.has(e.id)),
      rescheduleExams: [
        ...rescheduleExams.filter((e) => !movedIds.has(e.id)),
        ...movedExams.map((e) => ({ ...e, timeColumnId: "0" })),
      ],
    });

    return { snapshot, movedExams };
  },

  restoreSnapshot: (snapshot) => set(snapshot),
}));
