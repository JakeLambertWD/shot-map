import { Text } from "@mantine/core";

type CountBadgeProps = {
  count: number;
};

// A small amber pill with a count, e.g. how many posts are waiting on the Posts button.
export function CountBadge({ count }: CountBadgeProps) {
  return (
    <Text
      component="span"
      fz="xs"
      fw={900}
      c="teal.9"
      bg="amber.5"
      px={6}
      miw={22}
      ta="center"
      style={{ borderRadius: 11, lineHeight: "22px" }}
    >
      {count}
    </Text>
  );
}
