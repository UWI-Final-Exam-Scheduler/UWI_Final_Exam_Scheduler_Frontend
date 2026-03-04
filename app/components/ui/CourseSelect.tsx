"use client";

import { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";

type Option = { value: string; label: string };
type CourseItem = { courseCode: string; name: string };

type SelectProps = {
  data: CourseItem[];
  onChange?: (courseCode: string | null) => void;
};

export default function CourseSelect({ data, onChange }: SelectProps) {
  const [selectedCourse, setSelectedCourse] = useState<Option | null>(null);

  const options = data.map((item) => ({
    value: item.courseCode,
    label: item.courseCode,
  }));

  const handleChange = (option: SingleValue<Option>) => {
    setSelectedCourse(option);
    onChange?.(option ? option.value : null);
  };

  return (
    <Select
      options={options}
      value={selectedCourse}
      placeholder="Select a course..."
      onChange={handleChange}
    />
  );
}
