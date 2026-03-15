import { Button } from "@radix-ui/themes";
import type { ReactNode } from "react";

type CustomButtonProps = {
  buttonname: string;
  color?: "blue" | "gray";
  size?: "1" | "2" | "3";
  type?: "button" | "submit";
  onclick?: () => void;
  className?: string;
  disabled?: boolean;
};

export default function CustomButton({
  buttonname,
  size,
  type,
  onclick,
  className,
  disabled,
  color = "blue",
}: CustomButtonProps) {
  return (
    <Button
      variant="solid"
      color={color}
      radius="large"
      type={type || "button"}
      size={size || "2"}
      style={{
        justifyContent: "flex-start",
        padding: "var(--space-2)",
      }}
      onClick={onclick}
      className={className}
      disabled={disabled}
    >
      {buttonname}
    </Button>
  );
}
