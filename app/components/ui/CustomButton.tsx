import { Button } from "@radix-ui/themes";
import type { ReactNode } from "react";

type CustomButtonProps = {
  buttonname: string;
  size?: "1" | "2" | "3";
  type?: "button" | "submit";
};

export default function CustomButton({
  buttonname,
  size,
  type,
}: CustomButtonProps) {
  return (
    <Button
      variant="solid"
      color="blue"
      radius="large"
      type={type || "button"}
      size={size || "2"}
      style={{
        justifyContent: "flex-start",
        padding: "var(--space-2)",
      }}
    >
      {buttonname}
    </Button>
  );
}
