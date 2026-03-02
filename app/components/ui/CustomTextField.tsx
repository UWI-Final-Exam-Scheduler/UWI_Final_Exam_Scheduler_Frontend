import { TextField } from "@radix-ui/themes";
import type { ReactNode } from "react";

type CustomTextFieldProps = {
  icon?: ReactNode;
  placeholder: string;
  size?: "1" | "2" | "3";
  fullWidth?: boolean;
  width?: number;
};

export default function CustomTextField({
  icon,
  placeholder,
  size = "2",
  fullWidth = false,
  width,
}: CustomTextFieldProps) {
  return (
    <TextField.Root
      placeholder={placeholder}
      size={size}
      className={fullWidth ? "w-full" : ""}
      style={width ? { width } : undefined}
      variant="classic"
      radius="large"
    >
      {icon && (
        <TextField.Slot>
          <span className="inline-flex h-4 w-4 items-center justify-center">
            {icon}
          </span>
        </TextField.Slot>
      )}
    </TextField.Root>
  );
}
