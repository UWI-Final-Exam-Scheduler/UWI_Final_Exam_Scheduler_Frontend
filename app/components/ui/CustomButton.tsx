import { Button } from "@radix-ui/themes";
import type { ReactNode } from "react";

type CustomButtonProps = {
  buttonname: string;
  size?: "1" | "2" | "3";
};

export default function CustomButton({ buttonname, size }: CustomButtonProps) {
  return (
    <Button
      variant="solid"
      color="blue"
      radius="large"
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
