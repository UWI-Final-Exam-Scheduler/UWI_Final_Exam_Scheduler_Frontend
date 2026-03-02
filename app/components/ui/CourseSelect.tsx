"use client";

import { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";

type Option = { value: string; label: string };
type CourseItem = { courseCode: string; name: string };

type SelectProps = {
  value?: Option | null;
  onChange?: (value: Option | null) => void;
};

export default function CourseSelect({ value, onChange }: SelectProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Failed to load courses");
        const data: CourseItem[] = await res.json();

        const mapped = data.map((item) => ({
          value: item.courseCode,
          label: item.courseCode,
        }));
        setOptions(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadOptions();
  }, []);

  const handleChange = (option: SingleValue<Option>) => {
    onChange?.(option ?? null);
  };

  return (
    <Select
      options={options}
      value={value ?? null}
      onChange={handleChange}
      isLoading={isLoading}
      placeholder="Select a course..."
    />
  );
}
