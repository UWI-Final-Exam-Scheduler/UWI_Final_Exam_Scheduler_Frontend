"use client";

import { useState } from "react";
import Select, { SingleValue } from "react-select";

type Option = { value: string; label: string };
type VenueItem = { name: string; capacity: number };

type SelectProps = {
  data: VenueItem[];
  onChange?: (venueName: string | null) => void;
};

export default function VenueSelect({ data, onChange }: SelectProps) {
  const [selectedVenue, setSelectedVenue] = useState<Option | null>(null);

  const options = data.map((item) => ({
    value: item.name,
    label: item.name,
  }));

  const handleChange = (option: SingleValue<Option>) => {
    setSelectedVenue(option);
    onChange?.(option ? option.value : null);
  };

  return (
    <Select
      options={options}
      value={selectedVenue}
      placeholder="Select a venue..."
      onChange={handleChange}
    />
  );
}
