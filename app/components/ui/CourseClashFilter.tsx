"use client";

import Select from "react-select";

export type ClashFilterValue = "all" | "with" | "without";

type ClashFilterOption = {
  value: ClashFilterValue;
  label: string;
};

const options: ClashFilterOption[] = [
  { value: "all", label: "All Courses" },
  { value: "with", label: "With Clashes" },
  { value: "without", label: "Without Clashes" },
];

export default function CourseClashFilter({
  value,
  onChange,
}: {
  value: ClashFilterValue;
  onChange: (value: ClashFilterValue) => void;
}) {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <Select
      instanceId="course-clash-filter"
      options={options}
      value={selectedOption}
      isSearchable={false}
      onChange={(option) =>
        onChange((option?.value ?? "all") as ClashFilterValue)
      }
    />
  );
}
