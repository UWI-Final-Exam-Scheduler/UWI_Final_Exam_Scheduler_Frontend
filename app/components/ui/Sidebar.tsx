"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { SIDEBAR_LINKS } from "../constants/sidebarconstants";
import { usePathname } from "next/navigation";
import { Box, Button, Flex, Text } from "@radix-ui/themes";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Box
      asChild
      style={{
        width: isOpen ? 150 : 64,
        minHeight: "100vh",
        transition: "width 0.2s ease",
      }}
    >
      <aside className="flex flex-col">
        <Flex direction="column" gap="2" p="2">
          <Button
            variant="ghost"
            color="gray"
            size="2"
            onClick={() => setIsOpen((prev) => !prev)}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Icon
              icon={isOpen ? "mdi:menu-open" : "mdi:menu"}
              width={20}
              height={20}
            />
          </Button>
          {isOpen &&
            SIDEBAR_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "surface" : "ghost"}
                  color={isActive ? "blue" : "gray"}
                  size="2"
                  asChild
                  style={{
                    justifyContent: "flex-start",
                    padding: "var(--space-2)",
                  }}
                >
                  <a href={item.href}>
                    <Text size="2">{item.title}</Text>
                  </a>
                </Button>
              );
            })}
        </Flex>
      </aside>
    </Box>
  );
}
