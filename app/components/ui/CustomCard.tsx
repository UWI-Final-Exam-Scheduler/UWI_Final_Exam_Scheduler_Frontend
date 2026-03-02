import { Card, Box, Flex, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function CustomCard({ children, className }: CardProps) {
  return (
    <div className="rounded-lg p-3 shadow-md/10">
      <Card
        className={`${className}`}
        variant="surface"
        size="2"
        style={{ width: "100%" }}
      >
        <Flex align="center" direction="column" gap="2" p="4">
          <Text size="1" weight="bold">
            {" "}
            {children}{" "}
          </Text>
        </Flex>
      </Card>
    </div>
  );
}
