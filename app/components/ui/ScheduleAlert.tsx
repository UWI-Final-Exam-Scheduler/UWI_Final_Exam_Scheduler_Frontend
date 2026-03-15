"use client";

import { AlertDialog } from "radix-ui";

type ScheduleAlertProps = {
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  open: boolean;
};

export default function ScheduleAlert({
  title,
  message,
  onConfirm,
  onCancel,
  open,
}: ScheduleAlertProps) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel?.()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-gray-700 rounded-lg p-6 shadow-lg">
          <AlertDialog.Title className="text-lg font-bold mb-4">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mb-6">
            {message}
          </AlertDialog.Description>
          <AlertDialog.Action asChild>
            <button
              onClick={onConfirm}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Confirm
            </button>
          </AlertDialog.Action>
          <AlertDialog.Cancel asChild>
            <button
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </AlertDialog.Cancel>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
