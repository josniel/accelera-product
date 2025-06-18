// import { PointStackCellVariant } from "../types";

// interface PointStackCellProps {
//   variant: PointStackCellVariant;
// }
import { css } from "../../../../styled-system/css";
import { animatePulse } from "../../../animations";

const PointStackCell = () => {
  const elementCommon = css({
    // rounded-full w-5 h-5 bg-[#222A25]
    width: "1.25rem",
    height: "1.25rem",
    borderRadius: "9999px",
    backgroundColor: "darkGreen2",
  });
  return (
    <div
      className={css({
        // flex justify-end w-fit items-center gap-3 animate-pulse
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        width: "fit-content",
        gap: "0.75rem",
        animation: animatePulse,
      })}
    >
      <div
        className={css({
          // flex items-center animate-pulse gap-2
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          animation: animatePulse,
        })}
      >
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className={elementCommon}></div>)}
      </div>
    </div>
  );
};
export default PointStackCell;
