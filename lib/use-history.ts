"use client";

import { useEffect, useState } from "react";

import {
  getHistory,
  subscribeHistory,
  type HistoryEntry,
} from "./history";

export function useHistory(): {
  entries: HistoryEntry[];
  ready: boolean;
} {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setEntries(getHistory());
      setReady(true);
    };
    sync();
    return subscribeHistory(sync);
  }, []);

  return { entries, ready };
}
