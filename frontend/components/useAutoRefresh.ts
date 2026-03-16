"use client";

import { useEffect } from "react";

export function useAutoRefresh(interval = 10000) {
  useEffect(() => {
    const timer = setInterval(() => {
      window.location.reload();
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);
}