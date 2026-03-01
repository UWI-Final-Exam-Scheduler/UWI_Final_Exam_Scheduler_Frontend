import { Button } from "@radix-ui/themes";
import type { ReactNode } from "react";

type CustomButtonProps = {
  children: ReactNode;
};

export default function CustomButton({ children }: CustomButtonProps) {
  return (
    <Button
      variant="solid"
      color="blue"
      radius="large"
      size="2"
      style={{
        justifyContent: "flex-start",
        padding: "var(--space-2)",
      }}
    >
      {children}
    </Button>
  );
}
