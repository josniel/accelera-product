import { css } from "@/styled-system/css";
interface IconWrapperProps {
  children: React.ReactNode;
}
export const IconWrapper = ({ children }: IconWrapperProps) => {
  return (
    <div
      className={css({
        color: "accent",
        borderRadius: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        background: "linear-gradient(0deg, #354239 0%, #354239 100%)",
      })}
    >
      {children}
    </div>
  );
};
