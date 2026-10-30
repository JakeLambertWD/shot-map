"use client";

import { Input, SegmentedControl } from "@mantine/core";

type SpotToggleProps<Value extends string> = {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
};

// A labelled two-or-more option toggle used in the add and edit spot forms.
export function SpotToggle<Value extends string>({
  label,
  options,
  value,
  onChange,
}: SpotToggleProps<Value>) {
  return (
    <Input.Wrapper size="md" label={label}>
      <SegmentedControl<Value>
        size="md"
        fullWidth
        radius="xl"
        color="yellow"
        autoContrast
        data={[...options]}
        value={value}
        onChange={onChange}
        aria-label={label}
      />
    </Input.Wrapper>
  );
}
