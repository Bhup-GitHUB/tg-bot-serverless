import type { Email, User } from "./db/schema";

export const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export const code = (value: string) => `<code>${escapeHtml(value)}</code>`;

const EMAIL_COMMANDS = [
  "/add &lt;email&gt; [label] — save an email",
  "/del &lt;email&gt; — remove an email",
  "/list — show all saved emails",
  "/help — show this message",
];

const ADMIN_COMMANDS = [
  "/adduser &lt;id&gt; — authorize a person",
  "/deluser &lt;id&gt; — revoke access",
  "/users — list authorized users",
];

export const WELCOME = [
  "<b>Email Vault</b>",
  "Store and manage a list of email addresses.",
  "",
  "<b>Commands</b>",
  ...EMAIL_COMMANDS,
  "",
  "<b>Example</b>",
  "/add jane@work.com finance",
].join("\n");

export const WELCOME_ADMIN = [
  "<b>Email Vault</b>",
  "Store and manage a list of email addresses.",
  "",
  "<b>Commands</b>",
  ...EMAIL_COMMANDS,
  "",
  "<b>Admin</b>",
  ...ADMIN_COMMANDS,
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

export const ADMINS_ONLY = "Only admins can manage users.";

export const ADD_USER_USAGE = [
  "Usage: /adduser &lt;telegram_id&gt;",
  "The person can get their id by sending this bot any message.",
].join("\n");

export const DEL_USER_USAGE = "Usage: /deluser &lt;telegram_id&gt;";

export const userAdded = (id: string) => `Authorized ${code(id)}.`;

export const userExists = (id: string) => `${code(id)} is already authorized.`;

export const userRemoved = (id: string) => `Removed access for ${code(id)}.`;

export const userNotFound = (id: string) => `${code(id)} is not an authorized user.`;

export const cannotRemoveAdmin = (id: string) =>
  `${code(id)} is an admin and cannot be removed.`;

export const formatUsers = (adminIds: string[], members: User[]) => {
  const lines = ["<b>Authorized users</b>", "", "<b>Admins</b>"];
  adminIds.forEach((id) => lines.push(`- ${code(id)}`));
  lines.push("", `<b>Members (${members.length})</b>`);
  if (members.length === 0) {
    lines.push("- none yet");
  } else {
    members.forEach((member) => {
      const date = member.createdAt.toISOString().slice(0, 10);
      lines.push(`- ${code(member.telegramId)} · ${date}`);
    });
  }
  return lines.join("\n");
};
