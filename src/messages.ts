import type { Email } from "./db/schema";

export const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export const code = (value: string) => `<code>${escapeHtml(value)}</code>`;

export const WELCOME = [
  "<b>Email Vault</b>",
  "Store and manage a list of email addresses.",
  "",
  "<b>Commands</b>",
  "/add &lt;email&gt; [label] — save an email",
  "/del &lt;email&gt; — remove an email",
  "/list — show all saved emails",
  "/help — show this message",
  "",
  "<b>Example</b>",
  "/add jane@work.com finance",
].join("\n");

export const ADD_USAGE = [
  "Usage: /add &lt;email&gt; [label]",
  "Example: /add jane@work.com finance",
].join("\n");

export const DEL_USAGE = "Usage: /del &lt;email&gt;";

export const LIST_EMPTY = "No emails saved yet. Add one with /add.";

export const UNKNOWN = "I did not understand that. Send /help to see what I can do.";

export const notAuthorized = (userId: string) =>
  [
    "You are not authorized to use this bot.",
    `Your Telegram ID is ${code(userId)}.`,
    "Ask the owner to add you.",
  ].join("\n");

export const added = (email: string, label: string | null) => {
  const base = `Saved ${code(email)}`;
  return label ? `${base}\nLabel: ${escapeHtml(label)}` : base;
};

export const alreadyExists = (email: string) => `${code(email)} is already saved.`;

export const removed = (email: string) => `Removed ${code(email)}`;

export const notInList = (email: string) => `${code(email)} is not in the list.`;

export const formatList = (rows: Email[]) => {
  const header = `<b>Saved emails (${rows.length})</b>`;
  const lines = rows.map((row, index) => {
    const date = row.createdAt.toISOString().slice(0, 10);
    const label = row.label ? ` — ${escapeHtml(row.label)}` : "";
    return `${index + 1}. ${code(row.email)}${label} · ${date}`;
  });
  return [header, "", ...lines].join("\n");
};
