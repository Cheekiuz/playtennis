"use client";

import { useFormStatus } from "react-dom";
import { setTournamentStatus } from "@/app/admin/actions";

export default function AdminStatusButtons({
  id,
  section,
  published,
}: {
  id: string;
  section: string;
  published: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusForm id={id} section={section} status="verified" label="Verify" />
      <StatusForm id={id} section={section} status="cancelled" label="Cancel" />
      <StatusForm id={id} section={section} status="postponed" label="Postpone" />
      <StatusForm
        id={id}
        section={section}
        status={published ? "unpublish" : "publish"}
        label={published ? "Unpublish" : "Publish"}
      />
      <StatusForm id={id} section={section} status="archive" label="Archive" />
    </div>
  );
}

function StatusForm({
  id,
  section,
  status,
  label,
}: {
  id: string;
  section: string;
  status: string;
  label: string;
}) {
  return (
    <form action={setTournamentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="section" value={section} />
      <SubmitButton label={label} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}
