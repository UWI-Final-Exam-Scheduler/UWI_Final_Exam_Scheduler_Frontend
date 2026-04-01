"use client";

import Select, { SingleValue } from "react-select";
import { Option, SelectProps } from "@/app/components/types/subjectSelectTypes";

export default function SubjectSelect({
  data,
  onChange,
  value,
  placeholder = "Select a subject...", //default placeholder used for subject and course code select
  instanceId = "subject-select",
}: SelectProps) {
  const handleChange = (option: SingleValue<Option>) => {
    onChange?.(option ? option.value : null);
  };

  const optionsWithAll = [{ value: "", label: "All" }, ...data];
  const selectedOption =
    value === null || value === undefined
      ? null
      : (optionsWithAll.find((option) => option.value === value) ?? null);

  return (
    <Select
      instanceId={instanceId}
      options={optionsWithAll}
      value={selectedOption}
      placeholder={placeholder}
      onChange={handleChange}
    />
  );
}
