import { TextField } from "@radix-ui/themes";
import type { ReactNode, ChangeEvent, ComponentProps } from "react";

type RadixTextFieldType = ComponentProps<typeof TextField.Root>["type"];

type CustomTextFieldProps = {
  icon?: ReactNode;
  placeholder: string;
  size?: "1" | "2" | "3";
  fullWidth?: boolean;
  width?: number;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: RadixTextFieldType;
};

export default function CustomTextField({
  icon,
  placeholder,
  size = "2",
  fullWidth = false,
  width,
  value,
  onChange,
  type = "text",
}: CustomTextFieldProps) {
  return (
    <TextField.Root
      placeholder={placeholder}
      size={size}
      className={fullWidth ? "w-full" : ""}
      style={width ? { width } : undefined}
      variant="classic"
      radius="large"
      value={value}
      onChange={onChange}
      type={type}
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
