/**
 * Minimal markdown → HTML for AI-generated text (chat replies, portfolio
 * commentary). Handles just what the model's prompts actually ask for:
 * **bold**, *italic*, and "* "/"- " bullet lists. Was previously two
 * near-identical inline regex passes (ResearchChat, PortfolioSummary) that
 * only replaced bold/italic and left bullet markers as literal "* " text —
 * every generated bullet list rendered with raw asterisks instead of a list.
 *
 * Input is escaped before any markup is applied, since this is only ever
 * consumed via dangerouslySetInnerHTML.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export function markdownLiteToHtml(text: string): string {
  const lines = text.split("\n");
  const html: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    html.push(`<ul>${listItems.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bullet = line.match(/^[*-]\s+(.*)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      continue;
    }
    flushList();
    if (line === "") continue;
    html.push(`<p>${inline(line)}</p>`);
  }
  flushList();

  return html.join("");
}
