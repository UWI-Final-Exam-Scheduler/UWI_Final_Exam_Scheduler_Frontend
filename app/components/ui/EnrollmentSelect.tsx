"use client";

import { useState } from "react";
import Select, { SingleValue } from "react-select";

type Option = { value: string; label: string };
type EnrollmentItem = { student_id: string; courseCode: string };

type SelectProps = {
  data: EnrollmentItem[];
  onChange?: (student_id: string | null) => void;
};

export default function EnrollmentSelect({ data, onChange }: SelectProps) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<Option | null>(
    null,
  );

  const options = data.map((item) => ({
    value: item.student_id.toString(),
    label: item.student_id.toString(),
  }));

  const handleChange = (option: SingleValue<Option>) => {
    setSelectedEnrollment(option);
    onChange?.(option ? option.value : null);
  };

  return (
    <Select
      instanceId="enrollment-select"
      options={options}
      value={selectedEnrollment}
      placeholder="Select a student ID..."
      onChange={handleChange}
    />
  );
}
