export type PaginationProps = {
  page: number;
  totalPages: number;
  hasNext: boolean;
  onPageChange: (newPage: number) => void;
};
