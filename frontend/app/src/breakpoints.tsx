"use client";

import type { ReactNode } from "react";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export type BreakpointName = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xl1" | "2xl";
export type Breakpoint = {
  name: BreakpointName;
  xxs: boolean;
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xl1: boolean;
  "2xl": boolean;
};

export const BREAKPOINTS: Record<BreakpointName, number> = {
  "xxs": 415,
  "xs": 530,
  "sm": 640,
  "md": 768,
  "lg": 1024,
  "xl": 1280,
  "xl1": 1400,
  "2xl": 1740,
};

export function getBreakpointName(): BreakpointName {
  if (typeof window === "undefined") return "xxs";
  const w = window.innerWidth;
  if (w >= BREAKPOINTS["2xl"]) return "2xl";
  if (w >= BREAKPOINTS.xl1) return "xl1";
  if (w >= BREAKPOINTS.xl) return "xl";
  if (w >= BREAKPOINTS.lg) return "lg";
  if (w >= BREAKPOINTS.md) return "md";
  if (w >= BREAKPOINTS.sm) return "sm";
  if (w >= BREAKPOINTS.xs) return "xs";
  return "xxs";
}

export function getBreakpoint(): Breakpoint {
  if (typeof window === "undefined") {
    return {
      name: "xxs",
      xxs: true,
      xs: false,
      sm: false,
      md: false,
      lg: false,
      xl: false,
      xl1: false,
      "2xl": false,
    };
  }

  const breakpoint = getBreakpointName();
  const width = window.innerWidth;

  return {
    name: breakpoint,
    xxs: true,
    xs: width >= BREAKPOINTS.xs,
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
    xl1: width >= BREAKPOINTS.xl1,
    "2xl": width >= BREAKPOINTS["2xl"],
  };
}

export function useBreakpoint(callback: (breakpoint: Breakpoint) => void): void {
  const currentBreakpointRef = useRef<Breakpoint | null>(null);

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleResize = () => {
      const breakpoint = getBreakpoint();
      if (breakpoint.name !== currentBreakpointRef.current?.name) {
        currentBreakpointRef.current = breakpoint;
        callbackRef.current(breakpoint);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
}

const BreakpointNameContext = createContext<BreakpointName | null>(null);

export function BreakpointName({ children }: { children: ReactNode }) {
  const [breakpointName, setBreakpointName] = useState<BreakpointName>(() => (
    getBreakpointName()
  ));
  useBreakpoint((breakpoint) => {
    setBreakpointName(breakpoint.name);
  });
  return (
    <BreakpointNameContext.Provider value={breakpointName}>
      {children}
    </BreakpointNameContext.Provider>
  );
}

export function useBreakpointName(): BreakpointName {
  const breakpointName = useContext(BreakpointNameContext);
  if (breakpointName === null) {
    throw new Error("useBreakpointName must be called within BreakpointName");
  }
  return breakpointName;
}
