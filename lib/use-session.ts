"use client";

import { useEffect, useState } from "react";

import { readSession, subscribeSession, type Session } from "./session";

export function useSession(): {
  session: Session | null;
  ready: boolean;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSession(readSession());
      setReady(true);
    };
    sync();
    return subscribeSession(sync);
  }, []);

  return { session, ready };
}
