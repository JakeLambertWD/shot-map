"use client";

import { ActionIcon, Box, Container, Group, Stack, Text, Title } from "@mantine/core";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import { B_ROLL_SHOTS } from "./BRollShots.constants";

// The B-roll shots page: a list of camera moves and angles to get at a spot.
export function BRollShots() {
  return (
    <Container size="30rem" px={0} pb="xxl" w="100%">
      <Group justify="space-between" wrap="nowrap" px="xs" my="sm">
        <ActionIcon
          component={Link}
          href="/"
          aria-label="Back to map"
          variant="subtle"
          color="teal.0"
          size={44}
        >
          <IconChevronLeft size={24} />
        </ActionIcon>
        <Title order={1} fz="lg" c="teal.0">
          B-roll shots
        </Title>
        <Box w={44} />
      </Group>

      <Stack component="ul" gap={0} m={0} px="md" style={{ listStyle: "none" }}>
        {B_ROLL_SHOTS.map((shot) => (
          <Stack
            key={shot.name}
            component="li"
            gap={2}
            py="sm"
            style={{ borderBottom: "1px solid var(--mantine-color-teal-6)" }}
          >
            <Text fw={700} c="teal.0">
              {shot.name}
            </Text>
            <Text fz="sm" c="teal.1">
              {shot.description}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Container>
  );
}
