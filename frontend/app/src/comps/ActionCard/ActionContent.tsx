import { css } from "@/styled-system/css";
import { HFlex } from "@liquity2/uikit";
interface ActionContentProps {
  description: string;
  icon: React.ReactNode;
}
export const ActionContent = (
  { description, icon }: ActionContentProps,
) => {
  return (
    <HFlex
      justifyContent="space-between"
      alignItems="end"
      className={css({
        py: 28,
        h: 60,
      })}
    >
      <div
        className={css({
          fontSize: 14,
          fontWeight: 500,
          lgDown: { fontWeight: 500 },
          color: "contentAlt2",
          _groupHover: {
            color: "disabledSurface",
          },
          flexShrink: 1,
          maxWidth: "195px",
        })}
      >
        {description}
      </div>{" "}
      <div className={css({ w: 10, color: "content", mr: 12 })}>{icon}</div>
    </HFlex>
  );
};
