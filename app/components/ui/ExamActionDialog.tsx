"use client";

import { Dialog } from "radix-ui";
import { useState } from "react";

type ActionDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  confirmDisabled: boolean;
  confirmColor?: "blue" | "green";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  children: React.ReactNode;
};

export default function ExamActionDialog({
  open,
  title,
  confirmLabel,
  confirmDisabled,
  confirmColor = "blue",
  onConfirm,
  onCancel,
  children,
}: ActionDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }
  const confirmCls =
    confirmColor === "green"
      ? "bg-green-500 hover:bg-green-600"
      : "bg-blue-500 hover:bg-blue-600";

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="mb-4 text-lg font-bold">
            {title}
          </Dialog.Title>
          {children}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onCancel}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmDisabled || loading}
              className={`rounded-lg px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40 ${confirmCls}`}
            >
              {loading ? "Processing…" : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
