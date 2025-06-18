import { css } from "@/styled-system/css";
import { IconInfoFilled } from "@liquity2/uikit";

export function LoanStatusTag({
  status,
}: {
  status: "liquidated" | "redeemed";
}) {
  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        maxHeight: 16,
        height: 16,
        my: 0,
        padding: "0 10px",
        fontSize: 12,
        lineHeight: 0,
        fontWeight: 500,
        borderRadius: 100,
        userSelect: "none",
        "--color-liquidated": "token(colors.content)",
        "--background-liquidated": "token(colors.negative)",

        "--color-redeemed": "token(colors.dark)",
        "--background-redeemed": "token(colors.accent)",
      })}
      style={{
        color: `var(--color-${status})`,
        background: `var(--background-${status})`,
      }}
    >
      {status === "liquidated" ? "Liquidated" : "Redeemed"}
      {status === "redeemed" && (
        <span
          className={css({
            width: 12,
            height: 12,
            position: "relative",
            left: 4,
            color: "var(--color-redeemed)",
          })}
        >
          <IconInfoFilled
            size={12}
          />
        </span>
      )}
    </div>
  );
}
