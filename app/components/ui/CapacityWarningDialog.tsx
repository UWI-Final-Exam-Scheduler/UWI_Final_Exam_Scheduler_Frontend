"use client";

import { Dialog } from "radix-ui";

type CapacityWarningDialogProps = {
  open: boolean;
  courseCode: string;
  venueName: string;
  occupied: number;
  capacity: number;
  incomingStudents: number;
  onDismiss: () => void;
};

export default function CapacityWarningDialog({
  open,
  courseCode,
  venueName,
  occupied,
  capacity,
  incomingStudents,
  onDismiss,
}: CapacityWarningDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onDismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />

        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 rounded-xl bg-red-50 border border-red-200 p-6 shadow-xl">
          <Dialog.Title className="mb-2 text-lg font-bold text-red-700">
            Venue Capacity Exceeded
          </Dialog.Title>

          <p className="text-sm text-red-600 mb-4">
            <strong>{courseCode}</strong> cannot be moved to{" "}
            <strong>{venueName}</strong>.
          </p>

          <div className="rounded-lg bg-red-100 border border-red-200 px-4 py-3 text-sm text-red-700 space-y-1 mb-4">
            <p>
              Current occupancy: <strong>{occupied}</strong> students
            </p>
            <p>
              Exam requires: <strong>+{incomingStudents}</strong> students
            </p>
            <p>
              Total would be: <strong>{occupied + incomingStudents}</strong> /{" "}
              {capacity}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-sm text-white"
            >
              Dismiss
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
