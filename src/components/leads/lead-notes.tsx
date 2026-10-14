import { useMemo, useState, type FormEvent } from "react";
import { StickyNote } from "lucide-react";
import type { Lead } from "@/data/types";
import { useStore } from "@/state/store";
import { formatRelative } from "@/lib/format";
import { initialsOf } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/table";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Internal notes — visible to the team, never to the investor. */
export function LeadNotes({ lead }: { lead: Lead }) {
  const { state, dispatch, employeeName, dataSource } = useStore();
  const [draft, setDraft] = useState("");

  const notes = useMemo(
    () =>
      state.notes
        .filter((note) => note.leadId === lead.id)
        .sort((a, b) => b.at.localeCompare(a.at)),
    [state.notes, lead.id],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    dispatch({ type: "add-note", leadId: lead.id, body });
    setDraft("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2" aria-label="Add internal note">
        <div className="flex items-center justify-between">
          <Label htmlFor={`note-${lead.id}`} className="text-[13px] font-medium text-ink">
            Add a note
          </Label>
          <span className="text-2xs text-ink-subtle">Visible to the team only</span>
        </div>
        <div className="flex items-start gap-2">
          <Textarea
            id={`note-${lead.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="E.g. prefers WhatsApp, decision maker is the spouse…"
            rows={3}
          />
          <Button type="submit" variant="secondary" disabled={!draft.trim()}>
            Add note
          </Button>
        </div>
      </form>

      {dataSource === "database" ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-2xs leading-4 text-amber-800">
          Session-only: notes stay in this browser until the <code>lead_notes</code> table
          is created (see <code>supabase/migrations/002_lead_notes.sql</code>).
        </p>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          compact
          icon={StickyNote}
          title="No internal notes yet"
          description="Notes you add here stay private to your team."
        />
      ) : (
        <div className="space-y-2.5">
          {notes.map((note) => {
            const author = state.employees.find((employee) => employee.id === note.authorId);
            return (
              <div
                key={note.id}
                className="rounded-lg border border-ink-line bg-ink-wash/50 px-3.5 py-3"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="bg-ink text-[8px]">
                      {initialsOf(author?.name ?? employeeName(note.authorId))}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[13px] font-medium text-ink">
                    {employeeName(note.authorId)}
                  </span>
                  <span className="text-2xs text-ink-subtle">· {formatRelative(note.at)}</span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-5 text-ink-muted">
                  {note.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}