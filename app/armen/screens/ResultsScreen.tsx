"use client";

import { C, TIER_CONFIG } from "../lib/types";
import type { Match } from "../lib/types";
import { getDisplayName } from "../lib/helpers";
import { getPeriodTime } from "../data/periodTimes";
import { NavHeader, InfoCard, ChevronRight } from "../components/ui";

interface Props {
  className: string;
  matches: Match[];
  onBack: () => void;
  onSelectMatch: (m: Match) => void;
}

export default function ResultsScreen({ className, matches, onBack, onSelectMatch }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.pageBg }}>
      <NavHeader onBack={onBack} label="Study Buddies" title={className} />

      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-4">
        {matches.length === 0 ? (
          <InfoCard>No opted-in students share {className} yet.</InfoCard>
        ) : (
          <>
            <p className="text-xs" style={{ color: C.mutedText }}>
              {matches.length} match{matches.length !== 1 ? "es" : ""} — sorted by teacher overlap and shared free periods
            </p>

            {matches.map((match, i) => {
              const tier = TIER_CONFIG[match.tier];
              return (
                <button
                  key={match.student.id}
                  onClick={() => onSelectMatch(match)}
                  className="w-full rounded-2xl border px-4 py-4 text-left flex items-start gap-4 transition-all"
                  style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.cgpsBlue;
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(72,120,176,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.cardBorder;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Rank number */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: C.pageBg, color: C.mutedText }}
                  >
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + tier badge */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold" style={{ color: C.navyText }}>
                        {getDisplayName(match.student.name)}
                      </p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: tier.bg, color: tier.text }}
                      >
                        {tier.label}
                      </span>
                    </div>

                    {/* Teacher line */}
                    <p className="text-xs mb-2" style={{ color: C.mutedText }}>
                      {match.sameTeacher
                        ? `Same teacher · ${match.candidateTeacher}`
                        : `${match.candidateTeacher} (different teacher)`}
                    </p>

                    {/* Shared free period chips */}
                    {match.sharedFrees.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {match.sharedFrees.slice(0, 4).map((sf) => (
                          <span
                            key={sf.day}
                            className="text-xs font-medium px-2 py-0.5 rounded-full border"
                            style={{ backgroundColor: C.goldLight, borderColor: C.goldBorder, color: C.navyText }}
                          >
                            {sf.day} ·{" "}
                            {sf.periods.length === 1
                              ? getPeriodTime(sf.periods[0], sf.day)
                              : `${sf.periods.length} slots`}
                          </span>
                        ))}
                        {match.sharedFrees.length > 4 && (
                          <span className="text-xs self-center" style={{ color: C.mutedText }}>
                            +{match.sharedFrees.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: C.mutedText }}>No shared free periods</p>
                    )}
                  </div>

                  <ChevronRight color={C.cgpsBlue} />
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
