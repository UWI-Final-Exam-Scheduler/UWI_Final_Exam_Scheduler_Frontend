export type Option = { value: string; label: string };

export type SelectProps = {
  data: Option[];
  onChange?: (subjectCode: string | null) => void;
};
