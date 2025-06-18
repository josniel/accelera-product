"use client";

import type { MenuItem } from "./Menu/Menu";

import { Logo } from "@/src/comps/Logo/Logo";
// import { Tag } from "@/src/comps/Tag/Tag";
import content from "@/src/content";
// import { DEPLOYMENT_FLAVOR } from "@/src/env";
import { css } from "@/styled-system/css";
import { IconBorrow, IconDashboard, IconEarn, IconSeasonZero, IconStake } from "@liquity2/uikit";
// import Link from "next/link";
import { AccountButton } from "../AccountButton";
import { bottomLine, headerWrapper, innerWrapper } from "./Header.styles";
import { Menu } from "./Menu/Menu";
// import { MenuDrawerButton } from "./MenuDrawer";

export function Header() {
  const menuItems: MenuItem[] = [
    [content.menu.season_zero, "/season", <IconSeasonZero />, false, false],
    [content.menu.dashboard, "/", <IconDashboard />, false, false],
    [content.menu.borrow, "/borrow", <IconBorrow />, false, false],
    [content.menu.earn, "/earn", <IconEarn />, false, false],
    [content.menu.stake, "/stake", <IconStake />, false, false],
  ];
  return (
    <div
      className={headerWrapper}
    >
      <div
        className={css({
          lgDown: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            borderRadius: "0px 0px 20px 20px",
            background: "linear-gradient(148deg, rgba(12, 12, 12, 0.30) 0%, rgba(55, 74, 57, 0.30) 100%)",
            // backdropFilter: "blur(15px)",
            width: "auto",
            height: "471px",
            // border: "1px solid",
          },
        })}
        style={{
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
        }}
      >
      </div>
      <div
        className={bottomLine}
      >
      </div>
      <div
        className={innerWrapper}
      >
        <Logo />
        <Menu menuItems={menuItems} />
        <div
          className={css({
            position: "relative",
            maxWidth: "245px",
            width: "100%",
            lg: { pl: 40 },
            // lgDown: {
            //   display: "flex",
            //   justifyContent: "end",
            //   alignItems: "center",
            // },
          })}
        >
          <div
            className={css({
              w: 1,
              h: "400%",
              position: "absolute",
              top: -40,
              left: 0,
              bg: "white",
              opacity: 0.5,
              mixBlendMode: "overlay",
              display: { lgDown: "none", lg: "block" },
            })}
          >
          </div>
          <AccountButton />
        </div>
        {
          /* <div
          className={css({
            display: "grid",
            gridTemplateColumns: "1fr min-content",
            justifyContent: "end",
            gap: {
              base: 8,
              lg: 0,
            },
          })}
        >
          <div
            className={css({
              display: "grid",
              hideFrom: "large",
            })}
          >
            <MenuDrawerButton menuItems={menuItems} />
          </div>
        </div> */
        }
      </div>
    </div>
  );
}
