"use client";

import { Badge, Box, Card, Group, List, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
  IconCamera,
  IconCheck,
  IconClock,
  IconFlame,
  IconInfoCircle,
  IconListCheck,
  IconSparkles,
} from "@tabler/icons-react";
import {
  CONTENT_TABS,
  POSTING_SCHEDULE,
  type ContentTabConfig,
  type ContentTabId,
} from "./SpotContentTabs.constants";

type ContentGuidePanelProps = {
  tabId: ContentTabId;
  spotTitle: string;
};

export function ContentGuidePanel({ tabId, spotTitle }: ContentGuidePanelProps) {
  const config = CONTENT_TABS.find((t) => t.id === tabId) as ContentTabConfig | undefined;

  if (!config) return null;

  if (tabId === "shoot-day") {
    return (
      <Stack gap="lg" px="md" pt="xs" pb="xl">
        <Box>
          <Group gap="xs" mb={4}>
            <Badge color="yellow" variant="light" size="sm" radius="xs">
              On-Location Checklist
            </Badge>
          </Group>
          <Title order={2} fz="xl" c="brown.0">
            What to capture at {spotTitle}
          </Title>
          <Text fz="sm" c="brown.1" mt={4}>
            Complete checklist on shoot day to feed all 6 content formats.
          </Text>
        </Box>

        <Paper
          p="md"
          radius="sm"
          bg="brown.8"
          withBorder
          style={{ borderColor: "var(--mantine-color-brown-7)" }}
        >
          <Group gap="xs" mb="sm">
            <ThemeIcon color="yellow" variant="light" size="md" radius="sm">
              <IconListCheck size={18} />
            </ThemeIcon>
            <Text fw={600} fz="sm" c="brown.0">
              Capture Checklist
            </Text>
          </Group>
          <List
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon color="yellow" size={20} radius="xl" variant="subtle">
                <IconCheck size={14} />
              </ThemeIcon>
            }
          >
            {config.captureOnDay.map((item, index) => (
              <List.Item key={index}>
                <Text fz="sm" c="brown.0" lh={1.4}>
                  {item}
                </Text>
              </List.Item>
            ))}
          </List>
        </Paper>

        <Box>
          <Group gap="xs" mb="xs">
            <ThemeIcon color="yellow" variant="light" size="md" radius="sm">
              <IconClock size={18} />
            </ThemeIcon>
            <Text fw={600} fz="md" c="brown.0">
              Posting order (3–4 weeks schedule)
            </Text>
          </Group>
          <Text fz="xs" c="brown.1" mb="md">
            Release cadence for this location, mixed with your other spot content.
          </Text>

          <Stack gap="sm">
            {POSTING_SCHEDULE.map((post) => (
              <Card
                key={post.step}
                p="sm"
                radius="sm"
                bg="brown.8"
                withBorder
                style={{ borderColor: "var(--mantine-color-brown-7)" }}
              >
                <Group justify="space-between" align="center" mb={4}>
                  <Group gap="xs">
                    <Badge color="yellow" variant="filled" size="sm" radius="xs" c="dark.9">
                      Post #{post.step}
                    </Badge>
                    <Text fw={600} fz="sm" c="brown.0">
                      {post.title}
                    </Text>
                  </Group>
                  <Text fz="xs" c="brown.1" fw={500}>
                    {post.timing}
                  </Text>
                </Group>
                <Text fz="xs" c="brown.1" lh={1.4}>
                  {post.note}
                </Text>
              </Card>
            ))}

            <Card
              p="sm"
              radius="sm"
              bg="brown.8"
              withBorder
              style={{ borderColor: "var(--mantine-color-brown-7)" }}
            >
              <Group justify="space-between" align="center" mb={4}>
                <Group gap="xs">
                  <Badge color="yellow" variant="outline" size="sm" radius="xs">
                    Trial Reels
                  </Badge>
                  <Text fw={600} fz="sm" c="brown.0">
                    Trial reel variants (3–4)
                  </Text>
                </Group>
                <Text fz="xs" c="brown.1" fw={500}>
                  Any time
                </Text>
              </Group>
              <Text fz="xs" c="brown.1" lh={1.4}>
                Non-follower tests; share only the winning hook to your main grid.
              </Text>
            </Card>
          </Stack>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack gap="md" px="md" pt="xs" pb="xl">
      <Box>
        <Group gap="xs" mb={4}>
          {config.orderBadge && (
            <Badge color="yellow" variant="light" size="sm" radius="xs">
              {config.orderBadge}
            </Badge>
          )}
          <Badge variant="outline" color="brown.2" size="sm" radius="xs">
            {config.type}
          </Badge>
        </Group>
        <Title order={2} fz="xl" c="brown.0">
          {config.title}
        </Title>
        <Text fz="sm" c="brown.1" mt={4} lh={1.4}>
          {config.summary}
        </Text>
      </Box>

      {/* On the day capture requirement */}
      <Paper
        p="md"
        radius="sm"
        bg="brown.8"
        withBorder
        style={{ borderColor: "var(--mantine-color-brown-7)" }}
      >
        <Group gap="xs" mb="xs">
          <ThemeIcon color="yellow" variant="light" size="md" radius="sm">
            <IconCamera size={18} />
          </ThemeIcon>
          <Text fw={600} fz="sm" c="brown.0">
            What to capture on the day
          </Text>
        </Group>
        <List
          spacing="xs"
          size="sm"
          icon={
            <ThemeIcon color="yellow" size={18} radius="xl" variant="subtle">
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          {config.captureOnDay.map((item, idx) => (
            <List.Item key={idx}>
              <Text fz="sm" c="brown.0" lh={1.4}>
                {item}
              </Text>
            </List.Item>
          ))}
        </List>
      </Paper>

      {/* Structure / Breakdown */}
      {config.structure && config.structure.length > 0 && (
        <Box>
          <Text fw={600} fz="sm" c="brown.0" mb="xs">
            Format Structure & Breakdown
          </Text>
          <Stack gap="xs">
            {config.structure.map((item, idx) => (
              <Card
                key={idx}
                p="sm"
                radius="sm"
                bg="brown.8"
                withBorder
                style={{ borderColor: "var(--mantine-color-brown-7)" }}
              >
                <Text fw={600} fz="xs" c="yellow.5" tt="uppercase" lts="0.05em" mb={2}>
                  {item.label}
                </Text>
                <Text fz="sm" c="brown.0" lh={1.4}>
                  {item.text}
                </Text>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* Options if present (e.g. 1 Clip) */}
      {config.options && config.options.length > 0 && (
        <Box>
          <Group gap="xs" mb="xs">
            <ThemeIcon color="yellow" variant="subtle" size="sm">
              <IconSparkles size={16} />
            </ThemeIcon>
            <Text fw={600} fz="sm" c="brown.0">
              1 Clip options for this scene
            </Text>
          </Group>
          <Stack gap="xs">
            {config.options.map((option, idx) => (
              <Card
                key={idx}
                p="sm"
                radius="sm"
                bg="brown.8"
                withBorder
                style={{ borderColor: "var(--mantine-color-brown-7)" }}
              >
                <Text fz="sm" c="brown.0" lh={1.4}>
                  {option}
                </Text>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* Strategy and Key Rules */}
      <Box>
        <Group gap="xs" mb="xs">
          <ThemeIcon color="yellow" variant="subtle" size="sm">
            <IconInfoCircle size={16} />
          </ThemeIcon>
          <Text fw={600} fz="sm" c="brown.0">
            Strategy & Execution
          </Text>
        </Group>
        <Stack gap="xs">
          {config.description.map((desc, idx) => (
            <Text key={idx} fz="sm" c="brown.1" lh={1.45}>
              • {desc}
            </Text>
          ))}
        </Stack>
      </Box>

      {/* Tips if present */}
      {config.tips && config.tips.length > 0 && (
        <Paper
          p="sm"
          radius="sm"
          bg="brown.8"
          withBorder
          style={{ borderColor: "var(--mantine-color-yellow-8)" }}
        >
          <Group gap="xs" mb="xs">
            <ThemeIcon color="yellow" variant="light" size="sm" radius="xs">
              <IconFlame size={14} />
            </ThemeIcon>
            <Text fw={600} fz="xs" c="yellow.5" tt="uppercase" lts="0.05em">
              Pro Execution Tips
            </Text>
          </Group>
          <Stack gap="xs">
            {config.tips.map((tip, idx) => (
              <Text key={idx} fz="xs" c="brown.0" lh={1.4}>
                {tip}
              </Text>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
