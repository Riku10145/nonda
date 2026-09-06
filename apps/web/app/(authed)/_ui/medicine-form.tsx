"use client";

import { Anchor, Button, Chip, Group, Stack, Text, TextInput } from "@mantine/core";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useState, useTransition, type FormEvent } from "react";

import { timingsFromSelection, type MedicineDraft } from "@/lib/domain/medicine";
import { TIMINGS, timingLabel } from "@/lib/domain/timing";
import { createMedicine, deleteMedicine, updateMedicine } from "../actions";

export function MedicineForm({ draft, error }: { draft: MedicineDraft; error?: string }) {
  const [name, setName] = useState(draft.name);
  const [selected, setSelected] = useState<string[]>(
    TIMINGS.filter((timing) => draft.selection[timing]),
  );
  const [localError, setLocalError] = useState<string | undefined>(error);
  const [pending, start] = useTransition();
  const action = draft.mode === "create" ? createMedicine : updateMedicine.bind(null, draft.id);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const selection = {
      morning: selected.includes("morning"),
      afternoon: selected.includes("afternoon"),
      evening: selected.includes("evening"),
    };
    if (!name.trim() || !timingsFromSelection(selection)) {
      event.preventDefault();
      setLocalError("名前と服用タイミングを入力してください");
    }
  };

  return (
    <form action={action} onSubmit={onSubmit}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Anchor component={Link} href="/medicines" c="dimmed">
            キャンセル
          </Anchor>
          <SaveButton />
        </Group>
        {localError && (
          <Text c="red" size="sm">
            {localError}
          </Text>
        )}
        <TextInput
          name="name"
          label="名前"
          placeholder="自分でわかる名前でOK"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            服用タイミング
          </Text>
          <Chip.Group multiple value={selected} onChange={setSelected}>
            <Group>
              {TIMINGS.map((timing) => (
                <Chip key={timing} value={timing}>
                  {timingLabel(timing)}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
          {TIMINGS.map((timing) =>
            selected.includes(timing) ? (
              <input key={timing} type="hidden" name={timing} value="on" />
            ) : null,
          )}
        </Stack>
        {draft.mode === "edit" && (
          <Button
            color="red"
            variant="light"
            type="button"
            loading={pending}
            onClick={() => {
              if (window.confirm("この薬を削除しますか？")) {
                start(() => deleteMedicine(draft.id));
              }
            }}
          >
            削除
          </Button>
        )}
      </Stack>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      保存
    </Button>
  );
}
