// import { SliderCellVariant } from "../types";

// interface SliderCellProps {
//   // variant: SliderCellVariant;
// }

import { css } from "../../../../styled-system/css";
import { animatePulse } from "../../../animations";

const SliderCell = () => {
  return (
    <div
      className={css({
        // "flex justify-end w-fit items-center gap-3 animate-pulse"
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
          // w-60 h-3 rounded-lg bg-shark-300
          width: "15rem",
          height: "0.75rem",
          borderRadius: "0.5rem",
          backgroundColor: "darkGreen2",
        })}
      >
      </div>
    </div>
  );
};
export default SliderCell;
