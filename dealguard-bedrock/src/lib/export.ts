import { tr } from "./i18n";
import { PROVISION_BY_ID } from "./provisions";
import type { Analysis, Lang, ProvisionRecord } from "./types";

// The reply letter and schedule of amendments are built from the changes the
// user ticked, in code, so they're instant and match the selection exactly.

export interface ChangeRow {
  no: number;
  provisionId: string;
  clause: string;
  title: string;
  original: string | null; // verified quote from the document, if the change replaces one
  proposed: string;
  reason: string;
}

export function changeRows(analysis: Analysis, records: ProvisionRecord[]): ChangeRow[] {
  const facts = new Map(analysis.facts.map((f) => [f.id, f]));
  return records
    .filter((r) => r.change)
    .map((r, i) => ({
      no: i + 1,
      provisionId: r.provision_id,
      clause: r.change!.clause_ref ?? "New clause",
      title: PROVISION_BY_ID[r.provision_id]?.label ?? r.headline,
      original: r.change!.replaces_fact_id ? (facts.get(r.change!.replaces_fact_id)?.sources[0]?.quote ?? null) : null,
      proposed: r.change!.proposed_wording,
      reason: r.why || r.headline,
    }));
}

// Asks are written to the subcontractor ("not caused by you"); the letter is
// written by the subcontractor, so switch the point of view.
const asSubcontractor = (text: string, lang: Lang) =>
  lang === "ms" ? text.replace(/\banda\b/gi, "kami") : text.replace(/\byour\b/gi, "our").replace(/\byou\b/gi, "us");

export function letterMarkdown(analysis: Analysis, records: ProvisionRecord[], lang: Lang = "en"): string {
  const L = (text: string, vars?: Record<string, string | number>) => tr(lang, text, vars);
  const d = analysis.deal;
  const rows = changeRows(analysis, records);
  const asks = records.filter((r) => r.negotiation);
  const missing = (analysis.decision?.missing_evidence ?? []).filter((m) => m.timing === "before_signing").map((m) => m.item);
  const value = d.contractValue ? ` (RM ${d.contractValue.toLocaleString("en-MY")})` : "";
  const lines = [
    `**${L("[Your company name]")}**`,
    L("[Address]"),
    "",
    L("[Date]"),
    "",
    L("[Name, designation]"),
    L("[Main contractor]"),
    "",
    `**${L("Re: Letter of Award: {package}", { package: d.packageType || L("[package]") })}**`,
    "",
    L("Dear Sir/Madam,"),
    "",
    L("Thank you for your Letter of Award for {package}{value}. We are keen to carry out the works.", { package: d.packageType || L("the package"), value }),
    "",
    rows.length
      ? L("Our acceptance is subject to the amendments set out in the attached Schedule of Amendments, which we summarise in order of importance:")
      : L("Our acceptance is subject to the points below, which we summarise in order of importance:"),
    "",
    ...asks.map((r, i) => {
      const ref = r.change?.clause_ref ? ` (${r.change.clause_ref})` : "";
      return `${i + 1}. **${L(PROVISION_BY_ID[r.provision_id]?.label ?? r.headline)}${ref}.** ${asSubcontractor(r.negotiation!.ask, lang)}`;
    }),
    "",
  ];
  if (missing.length) {
    lines.push(L("We would also be grateful for copies of the following before we accept:"), "", ...missing.map((m) => `- ${m}`), "");
  }
  lines.push(
    L("Given the above, we ask that the acceptance period be extended so these points can be agreed. We would welcome a meeting this week."),
    "",
    L("Yours faithfully,"),
    "",
    L("[Name]"),
    L("[Designation]"),
    `${L("for and on behalf of")} **${L("[Your company name]")}**`,
  );
  return lines.join("\n");
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Schedule of amendments as a Word file: clause, current wording, proposed wording, reason. */
export async function downloadAmendmentsDocx(analysis: Analysis, records: ProvisionRecord[], lang: Lang = "en") {
  const L = (text: string) => tr(lang, text);
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, ShadingType } = await import("docx");
  const rows = changeRows(analysis, records);
  const cell = (text: string, opts: { bold?: boolean; strike?: boolean; header?: boolean } = {}) =>
    new TableCell({
      shading: opts.header ? { type: ShadingType.CLEAR, color: "auto", fill: "E6EDF7" } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold || opts.header, strike: opts.strike, size: 20 })] })],
    });
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(L("Schedule of Amendments"))] }),
          new Paragraph({ children: [new TextRun({ text: `${analysis.deal.packageType || L("Subcontract package")}. ${L("Proposed by the Subcontractor for discussion.")}`, size: 20 })] }),
          new Paragraph({ children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ tableHeader: true, children: ["No.", "Clause", "Current wording", "Proposed wording", "Reason"].map((h) => cell(L(h), { header: true })) }),
              ...rows.map(
                (r) =>
                  new TableRow({
                    children: [cell(String(r.no)), cell(`${L(r.clause)}: ${L(r.title)}`, { bold: true }), cell(r.original ?? L("(not addressed)"), { strike: Boolean(r.original) }), cell(r.proposed), cell(r.reason)],
                  }),
              ),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [new TextRun({ text: L("Proposed wording prepared with DealGuard MY for discussion. Commercial guidance only, not legal advice; have a lawyer review before signing."), italics: true, size: 18 })] }),
        ],
      },
    ],
  });
  save(await Packer.toBlob(doc), "schedule-of-amendments.docx");
}

/** A Markdown draft (the reply letter or an AI draft) as a simple Word file. */
export async function downloadLetterDocx(markdown: string, filename = "reply-to-letter-of-award.docx") {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const runs = (line: string, bold = false) =>
    line
      .split(/(\*\*[^*]+\*\*)/g)
      .filter(Boolean)
      .map((part) => (part.startsWith("**") ? new TextRun({ text: part.slice(2, -2), bold: true }) : new TextRun({ text: part, bold })));
  const paragraphs = markdown.split("\n").map((raw) => {
    const heading = /^#{1,6}\s+/.test(raw);
    const line = raw.replace(/^#{1,6}\s+/, "").replace(/^>\s?/, "").replace(/^- /, "• ");
    return new Paragraph({ children: runs(line, heading) });
  });
  save(await Packer.toBlob(new Document({ sections: [{ children: paragraphs }] })), filename);
}
