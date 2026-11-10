"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function AutonomyTitle({ children }: { children: ReactNode }) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return <h1 ref={titleRef} tabIndex={-1}>{children}</h1>;
}
