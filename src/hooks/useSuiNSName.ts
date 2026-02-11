"use client";

import { useState, useEffect } from "react";
import { resolveAddressToName } from "@/lib/suins";

export function useSuiNSName(address: string | null | undefined) {
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setName(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    resolveAddressToName(address).then((resolved) => {
      if (!cancelled) {
        setName(resolved);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [address]);

  return { name, isLoading };
}
