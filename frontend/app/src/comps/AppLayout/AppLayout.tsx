"use client";

import type { ReactNode } from "react";

// import { Banner } from "@/Banner";
import BackgroundDecorator from "@/src/comps/AppLayout/BackgroundDecorator";
// import { LegacyPositionsBanner } from "@/src/comps/LegacyPositionsBanner/LegacyPositionsBanner";
// import { LEGACY_CHECK } from "@/src/env";
import { css } from "@/styled-system/css";
import { mainWrapper } from "./AppLayout.styles";
import { Footer } from "./Footer/Footer";
import { Info } from "./Footer/Info";
import { Header } from "./Header/Header";

export const LAYOUT_WIDTH = 1280;

export function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={mainWrapper}
    >
      {
        <BackgroundDecorator />
        /* <div
        className={css({
          display: "flex",
          flexDirection: "column",
          width: "100%",
        })}
      >
        {LEGACY_CHECK && <LegacyPositionsBanner />}
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: 1,
            width: "100%",
          })}
        >
          <Banner />
        </div>
      </div> */
      }
      <Header />
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // gap: {
          //   base: 24,
          //   lg: 48,
          // },
          maxWidth: `calc(${LAYOUT_WIDTH}px + 48px)`,
          // margin: "0 auto",
          minHeight: 0,
          width: "98%",
          position: "relative",
          // border: "solid 1px",
          margin: {
            base: "0 auto",
            md: "0 auto",
          },
          pb: 90,
        })}
      >
        {children}
        <Info />
      </div>
      <Footer />
    </div>
  );
}
