import { css, cx } from "../../../../styled-system/css";
import { animatePulse } from "../../../animations";
import { ActionsCellVariant } from "../types";

interface ActionsCellProps {
  variant: ActionsCellVariant;
}

const ActionsCell = ({ variant }: ActionsCellProps) => {
  const commonBase = css({
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "fit-content",
    // gap: "0.75rem",
    animation: animatePulse,
  });

  const commonElement = css({
    // w-20 h-8 rounded-lg bg-shark-300
    width: "5rem",
    height: "2rem",
    borderRadius: "0.5rem",
    backgroundColor: "darkGreen2",
  });

  return (
    <>
      {variant === "Single" && (
        <div
          className={cx(
            commonBase,
            css({
              gap: "0.75rem",
            }),
          )}
        >
          <div
            className={commonElement}
          >
          </div>
        </div>
      )}
      {variant === "Pair" && (
        <div
          className={cx(
            commonBase,
            css({
              gap: "0.25rem",
            }),
          )}
        >
          <div className={commonElement}></div>
          <div className={commonElement}></div>
        </div>
      )}
    </>
  );
};
export default ActionsCell;
