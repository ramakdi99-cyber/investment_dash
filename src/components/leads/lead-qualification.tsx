import { CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The qualification sheet: the answers the lead gave us through the first
 * exchange. Every cell keeps its question so partial records stay readable.
 */
export function LeadQualification({ answers }: { answers: { question: string; answer: string | null }[] }) {
  if (answers.length === 0) {
    return null; // the sheet shows the empty-out state instead
  }

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-ink-line bg-ink-line sm:grid-cols-2">
      {answers.map((item) => (
        <div key={item.question} className="flex items-start gap-2.5 bg-white px-3.5 py-3">
          <HelpCircle className="mt-0.5 size-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-2xs font-medium uppercase tracking-[0.06em] text-ink-subtle">
              {item.question}
            </p>
            <p className={cn("mt-1 text-[13px] leading-5", item.answer ? "text-ink" : "text-ink-subtle italic")}>
              {item.answer ?? "Not provided"}
            </p>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2.5 bg-cobalt-soft/40 px-3.5 py-3">
        <CheckCircle2 className="size-3.5 shrink-0 text-cobalt" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-2xs font-medium uppercase tracking-[0.06em] text-cobalt">Qualification score</p>
          <p className="mt-1 text-[13px] leading-5 text-ink">
            {Math.round((answers.filter((item) => item.answer !== null).length / answers.length) * 100)}% complete
          </p>
        </div>
      </div>
    </div>
  );
}