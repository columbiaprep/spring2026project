"use client";

import { useState } from "react";
import type { Student } from "../data/parseSchedule";
import { C } from "../lib/types";
import type { Match } from "../lib/types";
import { getDisplayName, getFirstName } from "../lib/helpers";
import { cycleDays } from "../data/cycleDays";
import { getPeriodTime } from "../data/periodTimes";
import { useAuth } from "@/context/AuthContext";
import { NavHeader, SectionLabel, InfoCard, PeriodBadge } from "../components/ui";

interface Props {
  match: Match;
  todayKey: string;
  currentStudent: Student;
  onBack: () => void;
}

export default function DetailScreen({ match, todayKey, currentStudent, onBack }: Props) {
  const { user } = useAuth();
  const candidateName = getDisplayName(match.student.name);
  const todayCycleDay = cycleDays[todayKey] ?? null;

  const [connectState, setConnectState] = useState<"idle" | "sending" | "sent" | "ratelimit" | "error">("idle");
  const [invitesRemaining, setInvitesRemaining] = useState<number | null>(null);

  // ── Send connect email via API route ──────────────────────────────────────
  async function handleConnect() {
    setConnectState("sending");
    try {
      const res = await fetch("/api/send-connect-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName:    currentStudent.name,
          senderEmail:   user?.email ?? "",
          recipientName: match.student.name,
          recipientId:   match.student.id,
          className:     match.matchedClassName,
          sharedFrees:   match.sharedFrees,
        }),
      });
      if (res.status === 429) {
        setConnectState("ratelimit");
      } else if (res.ok) {
        const data = await res.json();
        setInvitesRemaining(data.invitesRemaining ?? null);
        setConnectState("sent");
      } else {
        setConnectState("error");
      }
    } catch {
      setConnectState("error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.pageBg }}>
      <NavHeader onBack={onBack} label="Match Details" title={candidateName} />

      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-5 pb-16">

        {/* ── Matched class ── */}
        <section>
          <SectionLabel>Matched Class</SectionLabel>
          <div className="rounded-2xl border px-5 py-4 flex flex-col gap-3" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}>
            <p className="text-base font-bold" style={{ color: C.navyText }}>{match.matchedClassName}</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide w-10 shrink-0" style={{ color: C.mutedText }}>You</span>
                <span className="text-sm" style={{ color: C.bodyText }}>{match.currentTeacher}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide w-10 shrink-0" style={{ color: C.mutedText }}>Them</span>
                <span className="text-sm" style={{ color: C.bodyText }}>{match.candidateTeacher}</span>
                {match.sameTeacher && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: C.cgpsBlue }}>
                    Same teacher
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Shared free periods across the 8-day cycle ── */}
        <section>
          <SectionLabel>When you can study together</SectionLabel>
          {match.sharedFrees.length === 0 ? (
            <InfoCard>No overlapping free periods across the 8-day cycle.</InfoCard>
          ) : (
            <>
              <p className="text-xs mb-3" style={{ color: C.mutedText }}>
                {match.totalSharedFrees} shared slot{match.totalSharedFrees !== 1 ? "s" : ""} across the 8-day cycle
              </p>
              <div className="flex flex-col gap-2">
                {match.sharedFrees.map((sf, i) => {
                  const isToday = todayCycleDay === sf.day;
                  return (
                    <div
                      key={i}
                      className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: isToday ? C.goldLight : C.cardBg,
                        borderColor: isToday ? C.goldBorder : C.cardBorder,
                      }}
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold" style={{ color: isToday ? "#7A6010" : C.navyText }}>
                          {sf.day}
                        </span>
                        {isToday && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: C.gold }}>
                            Today
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {sf.periods.map((p) => (
                          <div key={p} className="flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums" style={{ color: C.navyText }}>
                              {getPeriodTime(p, sf.day)}
                            </span>
                            <PeriodBadge period={p} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ── Connect button ── */}
        <div className="flex flex-col items-center gap-3">
          {connectState === "ratelimit" ? (
            <div
              className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-center"
              style={{ backgroundColor: "#FDE8E8", border: `1px solid ${C.errorRed}`, color: C.errorRed }}
            >
              3 invite limit reached — try again tomorrow.
            </div>
          ) : connectState !== "sent" ? (
            <button
              onClick={handleConnect}
              disabled={connectState === "sending"}
              className="w-full rounded-2xl px-5 py-3 text-sm font-bold transition-all"
              style={{
                backgroundColor: connectState === "sending" ? C.cgpsBlue + "99" : C.cgpsBlue,
                color: "#FFFFFF",
                cursor: connectState === "sending" ? "not-allowed" : "pointer",
              }}
            >
              {connectState === "sending" ? "Sending…" : `Connect with ${getFirstName(match.student.name)}`}
            </button>
          ) : (
            <div
              className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-center"
              style={{ backgroundColor: C.goldLight, border: `1px solid ${C.goldBorder}`, color: "#7A6010" }}
            >
              Email sent to {getFirstName(match.student.name)}!
            </div>
          )}

          {connectState === "error" && (
            <p className="text-xs text-center" style={{ color: C.errorRed }}>
              Something went wrong — check your Mailgun setup.
            </p>
          )}

          <p className="text-xs text-center" style={{ color: C.mutedText }}>
            {connectState === "sent" && invitesRemaining !== null
              ? `${invitesRemaining} invite${invitesRemaining !== 1 ? "s" : ""} remaining today.`
              : `Sends ${getFirstName(match.student.name)} your email so they can reach out.`}
          </p>
        </div>

      </div>
    </div>
  );
}
