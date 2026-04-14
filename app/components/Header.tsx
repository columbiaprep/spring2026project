"use client";

import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <Link href="/" className="text-sm font-semibold text-black dark:text-white">
        My App
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {user.photoURL && (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{user.displayName}</span>
            <button
              onClick={signOut}
              className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
