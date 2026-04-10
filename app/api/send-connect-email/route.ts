import { NextRequest, NextResponse } from "next/server";
import { getStudentEmail } from "@/app/armen/data/studentGradYears";
import { cycleDays } from "@/app/armen/data/cycleDays";
import { getPeriodStartTime } from "@/app/armen/data/periodTimes";

// ── Rate limiting ─────────────────────────────────────────────────────────────
// In-memory store: studentId → { count, dateKey }
// dateKey is "YYYY-MM-DD" — resets automatically when the date changes.
const DAILY_LIMIT = 3;
const rateLimitStore = new Map<number, { count: number; dateKey: string }>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-04-08"
}

// Returns true if the student is within the daily limit (and increments their count).
// Returns false if they've hit the cap.
function checkAndIncrement(studentId: number): boolean {
  const today = todayKey();
  const entry = rateLimitStore.get(studentId);

  if (!entry || entry.dateKey !== today) {
    // First invite of the day (or new day) — reset counter
    rateLimitStore.set(studentId, { count: 1, dateKey: today });
    return true;
  }

  if (entry.count >= DAILY_LIMIT) return false;

  entry.count += 1;
  return true;
}

// How many invites the student has left today (for the response header).
function remainingToday(studentId: number): number {
  const today = todayKey();
  const entry = rateLimitStore.get(studentId);
  if (!entry || entry.dateKey !== today) return DAILY_LIMIT;
  return Math.max(0, DAILY_LIMIT - entry.count);
}

interface SharedFree {
  day: string;       // "Day 1" … "Day 8"
  periods: string[]; // ["B"] or ["C", "D"]
}

interface ConnectEmailBody {
  senderName:    string;
  senderId:      number;
  recipientName: string;
  recipientId:   number;
  className:     string;
  sharedFrees:   SharedFree[];
}

// Builds a map of cycle day name → next upcoming calendar date formatted as "M/D".
// Dates in cycleDays are "YYYY/MM/DD"; we pick the soonest one that is today or later.
function buildNextDateMap(): Record<string, string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = Object.entries(cycleDays).sort(([a], [b]) => a.localeCompare(b));

  const map: Record<string, string> = {};
  for (const [dateKey, dayName] of sorted) {
    if (map[dayName]) continue; // already have the soonest date for this cycle day
    const [y, m, d] = dateKey.split("/").map(Number);
    const date = new Date(y, m - 1, d);
    if (date >= today) {
      map[dayName] = `${m}/${d}`; // e.g. "3/25"
    }
  }
  return map;
}

// Formats each shared free slot as "3/25 11:40 am"
function formatSharedFrees(sharedFrees: SharedFree[]): string {
  if (!sharedFrees || sharedFrees.length === 0) {
    return "  (No overlapping free periods found)";
  }

  const nextDate = buildNextDateMap();
  const lines: string[] = [];

  for (const sf of sharedFrees) {
    const date = nextDate[sf.day] ?? sf.day; // fall back to "Day N" if calendar ended
    for (const period of sf.periods) {
      const time = getPeriodStartTime(period, sf.day); // e.g. "11:40 am"
      lines.push(`  • ${date} ${time}`);
    }
  }

  return lines.join("\n");
}

async function sendMail(
  apiKey: string,
  domain: string,
  to: string,
  subject: string,
  text: string
): Promise<Response> {
  const form = new URLSearchParams();
  form.append("from",    `Study Buddies @ CGPS <mailgun@${domain}>`);
  form.append("to",      to);
  form.append("subject", subject);
  form.append("text",    text);

  return fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
}

function toDisplayName(raw: string): string {
  const p = raw.split(", ");
  return p.length > 1 ? `${p[1]} ${p[0]}` : raw;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return NextResponse.json(
      { error: "Mailgun is not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env.local." },
      { status: 500 }
    );
  }

  const body: ConnectEmailBody = await req.json();
  const { senderName, senderId, recipientName, recipientId, className, sharedFrees } = body;

  if (!checkAndIncrement(senderId)) {
    return NextResponse.json(
      { error: "You've reached your 3 invite limit for today. Try again tomorrow." },
      { status: 429, headers: { "X-Invites-Remaining": "0" } }
    );
  }

  const senderEmail    = getStudentEmail(senderName, senderId);
  const recipientEmail = getStudentEmail(recipientName, recipientId);

  if (!senderEmail || !recipientEmail) {
    return NextResponse.json(
      { error: "Could not resolve one or both student emails. Add them to studentGradYears.ts." },
      { status: 400 }
    );
  }

  const senderDisplay    = toDisplayName(senderName);
  const recipientDisplay = toDisplayName(recipientName);
  const senderFirst      = senderDisplay.split(" ")[0];
  const recipientFirst   = recipientDisplay.split(" ")[0];
  const freesBlock       = formatSharedFrees(sharedFrees);
  const subject          = `Study Invite — ${className}`;

  // ── Invite to recipient ───────────────────────────────────────────────────
  const inviteText = [
    `Hey ${recipientFirst},`,
    "",
    `${senderDisplay} would like to study ${className} with you.`,
    "",
    "Here are your next available shared free periods:",
    "",
    freesBlock,
    "",
    `Email ${senderFirst} to confirm: ${senderEmail}`,
    "",
    "— Study Buddies @ CGPS",
  ].join("\n");

  // ── Receipt to sender ────────────────────────────────────────────────────
  const receiptText = [
    `Hey ${senderFirst},`,
    "",
    `Your study invite for ${className} was sent to ${recipientDisplay} (${recipientEmail}).`,
    "",
    "Shared free periods you included:",
    "",
    freesBlock,
    "",
    `They'll email you at ${senderEmail} to confirm.`,
    "",
    "— Study Buddies @ CGPS",
  ].join("\n");

  const [inviteRes, receiptRes] = await Promise.all([
    sendMail(apiKey, domain, recipientEmail, subject,                  inviteText),
    sendMail(apiKey, domain, senderEmail,    `Your ${subject} (sent)`, receiptText),
  ]);

  if (!inviteRes.ok || !receiptRes.ok) {
    const failed = !inviteRes.ok ? inviteRes : receiptRes;
    const detail = await failed.text();
    console.error("Mailgun error:", detail);
    return NextResponse.json(
      { error: "Mailgun returned an error sending one or both emails." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, to: recipientEmail, receipt: senderEmail, invitesRemaining: remainingToday(senderId) }
  );
}
