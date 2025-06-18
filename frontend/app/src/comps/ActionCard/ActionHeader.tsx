import { css } from "@/styled-system/css";
import { HFlex } from "@liquity2/uikit";
interface ActionHeaderProps {
  title: string;
  icon: React.ReactNode;
}
export const ActionHeader = (
  { title, icon }: ActionHeaderProps,
) => {
  return (
    <HFlex justifyContent="space-between">
      <div
        className={css({
          fontSize: 16,
          fontWeight: 600,
          lgDown: { fontWeight: 500 },
          color: "content",
        })}
      >
        {title}
      </div>{" "}
      <div
        className={css({
          color: "accent",
          h: 36,
          w: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          _groupHover: {
            backgroundColor: "brandSecondaryGreen",
            borderRadius: "100%",
          },
        })}
      >
        {icon}
      </div>
    </HFlex>
  );
};
