import { refreshAccessToken } from "./oauth";

const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

function base64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeHeader(value: string) {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

function randomBoundary(prefix: string) {
  return `=_${prefix}_${Math.random().toString(36).slice(2)}`;
}

export type SendEmailArgs = {
  refreshToken: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  attachment?: {
    filename: string;
    contentType: string;
    content: Buffer;
  };
};

function buildAlternativePart(boundary: string, text: string, html: string) {
  return [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n");
}

export async function sendEmailViaGmail(args: SendEmailArgs) {
  const { access_token } = await refreshAccessToken(args.refreshToken);

  const fromHeader = args.fromName
    ? `${encodeHeader(args.fromName)} <${args.from}>`
    : args.from;

  const headers: string[] = [
    `From: ${fromHeader}`,
    `To: ${args.to}`,
    `Subject: ${encodeHeader(args.subject)}`,
    "MIME-Version: 1.0",
  ];

  let body: string;

  if (args.attachment) {
    const mixedBoundary = randomBoundary("mixed");
    const altBoundary = randomBoundary("alt");
    const parts: string[] = [];
    parts.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
    parts.push("");
    parts.push(`--${mixedBoundary}`);

    if (args.bodyHtml) {
      parts.push(buildAlternativePart(altBoundary, args.bodyText, args.bodyHtml));
    } else {
      parts.push('Content-Type: text/plain; charset="UTF-8"');
      parts.push("Content-Transfer-Encoding: 7bit");
      parts.push("");
      parts.push(args.bodyText);
    }
    parts.push("");
    parts.push(`--${mixedBoundary}`);
    parts.push(
      `Content-Type: ${args.attachment.contentType}; name="${args.attachment.filename}"`
    );
    parts.push("Content-Transfer-Encoding: base64");
    parts.push(
      `Content-Disposition: attachment; filename="${args.attachment.filename}"`
    );
    parts.push("");
    const b64 = args.attachment.content.toString("base64");
    parts.push(b64.match(/.{1,76}/g)?.join("\r\n") ?? b64);
    parts.push("");
    parts.push(`--${mixedBoundary}--`);
    body = parts.join("\r\n");
  } else if (args.bodyHtml) {
    const altBoundary = randomBoundary("alt");
    body = buildAlternativePart(altBoundary, args.bodyText, args.bodyHtml);
  } else {
    body = [
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      args.bodyText,
    ].join("\r\n");
  }

  const raw = base64url([...headers, body].join("\r\n"));

  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed: ${res.status} ${err}`);
  }

  return (await res.json()) as { id: string; threadId: string };
}
