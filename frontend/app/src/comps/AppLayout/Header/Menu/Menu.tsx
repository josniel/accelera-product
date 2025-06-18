import { css, cx } from "@/styled-system/css";
// import { token } from "@/styled-system/tokens";
import Link from "next/link";
// import { usePathname } from "next/navigation";
import { menuWrapper } from "./Menu.styles";
import { MenuItem } from "./MenuItem";

export type MenuItem = [
  label: string,
  url: string,
  Icon: React.ReactNode,
  redirect: boolean,
  isComingSoon: boolean,
];

export function Menu({
  menuItems,
}: {
  menuItems: MenuItem[];
}) {
  // const pathname = usePathname();
  return (
    <nav
      className={menuWrapper}
    >
      {menuItems.map(([label, href, Icon, redirect]) => {
        // const selected = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            href={href}
            key={label + href}
            target={redirect ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className={cx(
              css({
                // padding: "0 8px",
                position: "relative",
                fontSize: { "2xl": 14, "2xlDown": 12 },
                fontWeight: 400,
                py: 8,
                px: { lgDown: 64, "xl": 32, "xlDown": 20 },
                color: "content",
                _hover: { color: "accent" },
                transitionProperty: "color",
                transitionDuration: "0.3ms",
                transitionTimingFunction: "ease-in-out",
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                height: "100%",
                whiteSpace: "nowrap",
                textDecoration: "none",
                // _active: {
                //   translate: "0 1px",
                // },
                // _focusVisible: {
                //   outline: "2px solid token(colors.focused)",
                //   borderRadius: 4,
                // },
              }),
              "group",
            )}
            // style={{
            //   color: token(
            //     `colors.${selected ? "selected" : "interactive"}`,
            //   ),
            // }}
          >
            <MenuItem
              icon={Icon}
              label={label}
              // selected={selected}
            />
          </Link>
        );
      })}
    </nav>
  );
}
