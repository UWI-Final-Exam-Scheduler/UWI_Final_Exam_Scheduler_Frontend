import { TextField } from "@radix-ui/themes";
import type { ReactNode, ChangeEvent, ComponentProps } from "react";

type RadixTextFieldType = ComponentProps<typeof TextField.Root>["type"];

type CustomTextFieldProps = {
  icon?: ReactNode;
  placeholder: string;
  size?: "1" | "2" | "3";
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: RadixTextFieldType;
  className?: string; // can add custom width and responsive features with tailwind css
};

export default function CustomTextField({
  icon,
  placeholder,
  size = "2",
  value,
  onChange,
  type = "text",
  className,
}: CustomTextFieldProps) {
  return (
    <TextField.Root
      placeholder={placeholder}
      size={size}
      variant="classic"
      radius="large"
      value={value}
      onChange={onChange}
      type={type}
      className={`w-full ${className || ""}`}
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
