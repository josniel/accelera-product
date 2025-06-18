import { css, cx } from "../../../../styled-system/css";
import { animatePulse } from "../../../animations";
import { TokenCellVariant } from "../types";
interface TokenCellProps {
  variant: TokenCellVariant;
}
const TokenCell = ({ variant }: TokenCellProps) => {
  const commonBaseWrapper = css({
    // flex items-center gap-2 animate-pulse w-fit
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "fit-content",
    animation: animatePulse,
  });

  const flexCenter = css({
    display: "flex",
    alignItems: "center",
  });

  const flexCol = css({
    display: "flex",
    flexDirection: "column",
  });

  const commonBaseElement = css({
    // rounded-full w-7 h-7 bg-[#222A25]
    borderRadius: "full",
    width: "1.75rem",
    height: "1.75rem",
    backgroundColor: "darkGreen2",
  });

  const commonElement2 = css({
    // h-3 mb-2 rounded w-14 bg-[#222A25]
    height: "0.75rem",
    marginBottom: "0.5rem",
    borderRadius: "0.25rem",
    width: "3.5rem",
    backgroundColor: "darkGreen2",
  });

  return (
    <>
      {variant === "Single" && (
        <div className={commonBaseWrapper}>
          <div className={flexCenter}>
            <div className={commonBaseElement}></div>
          </div>
          <div className={flexCol}>
            <div
              className={css({
                // h-3 mb-2 rounded w-14 max-xxs:w-10 bg-[#222A25]
                height: "0.75rem",
                marginBottom: "0.5rem",
                borderRadius: "0.25rem",
                width: "3.5rem",
                xxsDown: {
                  width: "2.5rem",
                },
                backgroundColor: "darkGreen2",
              })}
            >
            </div>
            <div className={css({ display: "flex" })}>
              <div
                className={css({
                  // w-32 max-xxs:w-20 h-3 rounded bg-[#222A25]
                  width: "8rem",
                  xxsDown: {
                    width: "5rem",
                  },
                  height: "0.75rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "darkGreen2",
                })}
              >
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === "Pair" && (
        <div className={commonBaseWrapper}>
          <div className={flexCenter}>
            <div className={commonBaseElement}></div>
            <div className={cx(commonBaseElement, css({ ml: -8 }))}></div>
          </div>
          <div className={flexCol}>
            <div className={commonElement2}></div>
            <div className={css({ display: "flex" })}>
              <div
                className={css({
                  // w-40 h-3 rounded bg-[#222A25]
                  width: "10rem",
                  height: "0.75rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "darkGreen2",
                })}
              >
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === "SingleSquare" && (
        <div className={commonBaseWrapper}>
          <div className={flexCenter}>
            <div
              className={css({
                // rounded-sm w-11 h-11 bg-[#222A25]
                borderRadius: "0.125rem",
                width: "2.75rem",
                height: "2.75rem",
                backgroundColor: "darkGreen2",
              })}
            >
            </div>
          </div>
          <div className={flexCol}>
            <div className={commonElement2}></div>
            <div className={css({ display: "flex" })}>
              <div
                className={css({
                  // w-32 h-3 rounded bg-[#222A25]
                  width: "8rem",
                  height: "0.75rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "darkGreen2",
                })}
              >
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default TokenCell;
