import { Card } from "@radix-ui/themes";
import React, { ReactNode } from "react";

type LoginCardProps = {
  children?: ReactNode;
};

export default function LoginCard({ children }: LoginCardProps) {
  return (
    <Card
      variant="surface"
      size="2"
      style={{ width: "65%", height: "500px" }}
      className="bg-white rounded-lg p-3"
    >
      <h2 className="text-lg font-bold mb-4 text-center">Login</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </Card>
  );
}
