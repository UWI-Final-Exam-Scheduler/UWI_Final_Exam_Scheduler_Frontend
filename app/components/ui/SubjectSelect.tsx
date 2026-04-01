"use client";

import { useState } from "react";
import Select, { SingleValue } from "react-select";
import { Option, SelectProps } from "@/app/components/types/subjectSelectTypes";

export default function SubjectSelect({ data, onChange }: SelectProps) {
  const [selectedSubject, setSelectedSubject] = useState<Option | null>(null);
  const handleChange = (option: SingleValue<Option>) => {
    setSelectedSubject(option);
    onChange?.(option ? option.value : null);
  };

  const optionsWithAll = [{ value: "", label: "All" }, ...data];

  return (
    <Select
      instanceId="subject-select"
      options={optionsWithAll}
      value={selectedSubject}
      placeholder="Select a subject..."
      onChange={handleChange}
    />
  );
}
