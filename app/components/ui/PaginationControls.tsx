'use client";';
import CustomButton from "@/app/components/ui/CustomButton";
import { PaginationProps } from "@/app/components/types/paginationType";

export function PaginationControls({
  page,
  totalPages,
  hasNext,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="pagination mt-4 flex justify-center items-center space-x-2 gap-2">
      <CustomButton
        buttonname="First"
        onclick={() => onPageChange(1)}
        disabled={page === 1}
      />
      <CustomButton
        buttonname="Previous"
        onclick={() => onPageChange(page - 1)}
        disabled={page === 1}
      />
      <span>
        Page {page} / {totalPages}
      </span>
      <CustomButton
        buttonname="Next"
        onclick={() => onPageChange(page + 1)}
        disabled={!hasNext}
      />
      <CustomButton
        buttonname="Last"
        onclick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
      />
    </div>
  );
}
