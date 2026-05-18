"use client";

import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation'

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname() || ''

  // fixed width for inactive underlines (75% of previous value)
  const inactiveUnderlineWidth = '4.125rem'
  // make link boxes uniform height so underlines align
  const linkBoxStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 23,
    paddingLeft: 6,
    paddingRight: 6,
  }

  if (loading) return null;

  return (
    <header className="w-full">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link href="/grant-test" className="text-lg font-bold text-white inline-block relative" style={linkBoxStyle}>
              <span>3D CGPS Map</span>
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: -6,
                    background: 'rgba(220,220,220,0.45)',
                  width: pathname === '/grant-test' ? '100%' : inactiveUnderlineWidth,
                  height: pathname === '/grant-test' ? 3 : 1,
                  borderRadius: 2,
                }}
              />
            </Link>

            <nav className="flex items-center gap-6">
              <Link href="/jakejonny-test" className="text-sm font-medium text-white inline-block relative" style={linkBoxStyle}>
                <span>Office Hour Bookings</span>
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: -6,
                      background: 'rgba(220,220,220,0.45)',
                    width: pathname === '/jakejonny-test' ? '100%' : inactiveUnderlineWidth,
                    height: pathname === '/jakejonny-test' ? 3 : 1,
                    borderRadius: 2,
                  }}
                />
              </Link>
              <Link href="/armen" className="text-sm font-medium text-white inline-block relative" style={linkBoxStyle}>
                <span>Study Buddies</span>
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: -6,
                      background: 'rgba(220,220,220,0.45)',
                    width: pathname === '/armen' ? '100%' : inactiveUnderlineWidth,
                    height: pathname === '/armen' ? 3 : 1,
                    borderRadius: 2,
                  }}
                />
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName ?? "User"}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-white/90">{user.displayName}</span>
                <button
                  onClick={signOut}
                  className="ml-2 px-3 py-1 rounded bg-white text-blue-900 font-medium hover:opacity-90 transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1 rounded bg-white text-blue-900 font-medium hover:opacity-90 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* background stripe */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-blue-900 via-blue-1000 to-indigo-900 -z-10" />
    </header>
  );
}
