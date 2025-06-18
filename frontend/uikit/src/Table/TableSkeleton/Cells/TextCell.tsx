import { css, cx } from "../../../../styled-system/css";
import { animatePulse } from "../../../animations";
import { TextCellVariant } from "../types";
interface TextCellProps {
  variant: TextCellVariant;
}
const TextCell = ({ variant }: TextCellProps) => {
  const commonBaseElement = css({
    xxsDown: {
      width: "3.5rem",
    },
    height: "0.75rem",
    borderRadius: "0.25rem",
    backgroundColor: "darkGreen2",
  });

  const commonBaseWithInfo = css({
    // flex items-center w-fit  gap-1 animate-pulse
    display: "flex",
    alignItems: "center",
    width: "fit-content",
    gap: "0.25rem",
    animation: animatePulse,
  });

  return (
    <>
      {variant === "DoubleText" && (
        <div
          className={css({
            // flex flex-col items-end justify-center w-fit  animate-pulse
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            width: "fit-content",
            animation: animatePulse,
          })}
        >
          <div
            className={css({
              // w-10 max-xxs:w-6 h-3 mb-1 rounded bg-[#222A25]
              width: "2.5rem",
              xxsDown: {
                width: "1.5rem",
              },
              height: "0.75rem",
              marginBottom: "0.25rem",
              borderRadius: "0.25rem",
              backgroundColor: "darkGreen2",
            })}
          >
          </div>
          <div
            className={cx(
              css({
                // w-24 max-xxs:w-14 h-3 rounded bg-[#222A25]
                width: "6rem",
              }),
              commonBaseElement,
            )}
          >
          </div>
        </div>
      )}
      {variant === "OnlyText" && (
        <div
          className={css({
            // flex w-fit  animate-pulse
            display: "flex",
            width: "fit-content",
            animation: animatePulse,
          })}
        >
          <div
            className={cx(
              css({
                // w-20 max-xxs:w-14 h-3 rounded bg-[#222A25]
                width: "5rem",
              }),
              commonBaseElement,
            )}
          >
          </div>
        </div>
      )}
      {variant === "WithInfo" && (
        <div className={commonBaseWithInfo}>
          <div
            className={css({
              // w-10 h-3 rounded bg-[#222A25]
              width: "2.5rem",
              height: "0.75rem",
              borderRadius: "0.25rem",
              backgroundColor: "darkGreen2",
            })}
          >
          </div>
          <div
            className={css({
              // w-3 h-3 rounded-full bg-[#222A25]
              width: "0.75rem",
              height: "0.75rem",
              borderRadius: "9999px",
              backgroundColor: "darkGreen2",
            })}
          >
          </div>
        </div>
      )}
      {variant === "WithInfoLeft" && (
        <div className={commonBaseWithInfo}>
          <div
            className={css({
              // w-4 h-4 rounded-full bg-[#222A25]
              width: "1rem",
              height: "1rem",
              borderRadius: "9999px",
              backgroundColor: "darkGreen2",
            })}
          >
          </div>
          <div
            className={css({
              // w-10 max-xxs:w-7 h-3 rounded bg-[#222A25]
              width: "2.5rem",
              xxsDown: {
                width: "1.75rem",
              },
              height: "0.75rem",
              borderRadius: "0.25rem",
              backgroundColor: "darkGreen2",
            })}
          >
          </div>
        </div>
      )}
    </>
  );
};
export default TextCell;
