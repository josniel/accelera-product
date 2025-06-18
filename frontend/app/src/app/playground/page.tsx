"use client";

import { css } from "@/styled-system/css";
import { Card, CardContent, CardHeader } from "@liquity2/uikit";

export default function Page() {
  return (
    <div
      className={css({
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "calc(100vh - 251px)",
        zIndex: 10,
      })}
    >
      <Card mode="tertiary" wide>
        <CardHeader variant="secondary">
          <div
            className={css({
              width: "400px",
              height: "30px",
            })}
          >
          </div>
        </CardHeader>
        <CardContent variant="secondary">
          <div
            className={css({
              width: "400px",
              height: "100px",
            })}
          >
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
