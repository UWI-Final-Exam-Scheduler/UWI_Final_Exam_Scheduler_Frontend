"use client";

import { Dialog } from "radix-ui";

type SplitConflictDialogProps = {
  open: boolean;
  courseCode: string;
  existingTime?: number;
  existingDate?: string;
  onDismiss: () => void;
};

export default function SplitConflictDialog({
  open,
  courseCode,
  existingTime,
  existingDate,
  onDismiss,
}: SplitConflictDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onDismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />

        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 rounded-xl bg-yellow-50 border border-yellow-200 p-6 shadow-xl">
          <Dialog.Title className="mb-2 text-lg font-bold text-yellow-700">
            Invalid Split Scheduling
          </Dialog.Title>

          <p className="text-sm text-yellow-700 mb-4">
            <strong>{courseCode}</strong> has multiple splits.
          </p>
          {existingDate && existingTime ? (
            <p className="text-sm text-yellow-800 mb-4">
              Existing splits are scheduled on{" "}
              <strong>
                {existingDate} at {existingTime}
              </strong>
            </p>
          ) : (
            <p className="text-sm text-yellow-700 mb-4">
              Some splits are already scheduled on different times.
            </p>
          )}

          <div className="rounded-lg bg-yellow-100 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 mb-4">
            All splits must be scheduled on the{" "}
            <strong>same day and time</strong>.
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg bg-yellow-500 hover:bg-yellow-600 px-4 py-2 text-sm text-white"
            >
              Got it
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
