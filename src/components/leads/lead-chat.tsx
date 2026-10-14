import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import type { Lead } from "@/data/types";
import { useStore } from "@/state/store";
import { formatDateTime, formatTime, isSameDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/table";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The threaded conversation with the investor.
 *
 * Bubbles are grouped like WhatsApp: consecutive exchanges in the same
 * direction tighten their spacing, and a date rail separates days. Replies
 * you send appear instantly (client-side), with the last-contact timestamp
 * updating everywhere it is shown.
 */
export function LeadChat({ lead }: { lead: Lead }) {
  const { state, sendMessage, employeeName, dataSource } = useStore();
  const [draft, setDraft] = useState("");

  const thread = useMemo(
    () =>
      state.messages
        .filter((message) => message.leadId === lead.id)
        .sort((a, b) => a.at.localeCompare(b.at)),
    [state.messages, lead.id],
  );

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    // Database mode: last_contact_at is persisted first; the bubble only
    // appears when the write succeeded.
    const ok = await sendMessage(lead.id, body);
    setDraft(ok ? "" : body);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  if (thread.length === 0) {
    return (
      <EmptyState
        compact
        icon={SendHorizontal}
        title="No messages yet"
        description="The first inbound message will appear here."
      />
    );
  }

  return (
    <div className="flex h-full flex-col pb-1">
      <div className="flex-1 overflow-y-auto px-1 pb-2" role="log" aria-label="Conversation with investor">
        {thread.map((message, index) => {
          const previous = thread[index - 1];
          const sameDay = previous && isSameDay(new Date(previous.at), new Date(message.at));
          const grouped = Boolean(previous && previous.direction === message.direction);
          const isOutbound = message.direction === "outbound";

          return (
            <div key={message.id}>
              {!sameDay ? (
                <div className="flex items-center gap-3 py-3">
                  <span className="h-px flex-1 bg-ink-line" aria-hidden="true" />
                  <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-subtle">
                    {formatDateTime(message.at)}
                  </span>
                  <span className="h-px flex-1 bg-ink-line" aria-hidden="true" />
                </div>
              ) : null}

              <div
                className={cn(
                  "flex w-full",
                  isOutbound ? "justify-end" : "justify-start",
                  grouped ? "mt-1" : "mt-3",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-5 shadow-[0_1px_1px_rgba(11,13,18,0.03)]",
                    isOutbound ? "rounded-br-sm bg-cobalt text-white" : "rounded-bl-sm bg-ink-wash text-ink",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-2 text-[10px] leading-3",
                      isOutbound ? "text-white/70" : "text-ink-subtle",
                    )}
                  >
                    <span className="tabular">{formatTime(message.at)}</span>
                    {isOutbound ? "✓✓" : null}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="mt-3 border-t border-ink-line pt-3" aria-label="Reply on WhatsApp">
        <Label htmlFor={`reply-${lead.id}`} className="sr-only">
          Reply message
        </Label>
        <div className="flex items-end gap-2">
          <Textarea
            id={`reply-${lead.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Reply as ${employeeName(state.users[state.role].id)}… (Enter to send)`}
            className="min-h-[44px] max-h-32"
            rows={2}
          />
          <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send reply">
            <SendHorizontal />
          </Button>
        </div>
        {dataSource === "database" ? (
          <p className="mt-2 text-2xs leading-4 text-ink-subtle">
            Session-only thread: message bodies are not persisted until the AiSensy webhook
            lands in Supabase Edge Functions.
          </p>
        ) : state.users[state.role].role === "agent" ? (
          <p className="mt-2 text-2xs leading-4 text-ink-subtle">
            Replies are captured for demo purposes only — no WhatsApp is actually sent.
          </p>
        ) : null}
      </form>
    </div>
  );
}