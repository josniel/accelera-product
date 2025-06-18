// "use client";

// import { useEffect, useRef, useState } from "react";
// import { css } from "../../../styled-system/css";
// import { toBN } from "./numbers";

// interface SliderProps {
//   ticks?: number[];
//   setValue: (value: number | string) => void;
//   maxValue: number;
//   currentValue: number;
// }

// const Slider = ({
//   ticks = [0, 25, 50, 75, 100],
//   currentValue,
//   maxValue,
//   setValue,
// }: SliderProps) => {
//   const DEFAULT_VALUE = 25;
//   const [progress, setProgress] = useState<number>(DEFAULT_VALUE);
//   const [isDragging, setIsDragging] = useState<boolean>(false);
//   const progressRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!isDragging && currentValue !== undefined) {
//       const newProgress = (Number(currentValue) / maxValue) * 100;
//       setProgress(newProgress);
//     }
//   }, [currentValue, maxValue, isDragging]);

//   const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
//     if (!progressRef.current) return;
//     const rect = progressRef.current.getBoundingClientRect();
//     const clickX = e.clientX - rect.left;
//     const width = rect.width;
//     const clampedX = Math.max(0, Math.min(clickX, width));
//     const newProgress = (clampedX / width) * 100;
//     setProgress(newProgress);
//     const raw = toBN(newProgress).div(100).times(maxValue);
//     const formatted = raw.isGreaterThan(0.0001)
//       ? raw.toFixed(4)
//       : raw.toPrecision(4);
//     setValue(formatted);
//   };

//   const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragging = (e: MouseEvent | TouchEvent) => {
//     if (!isDragging || !progressRef.current) return;
//     const clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
//     const rect = progressRef.current.getBoundingClientRect();
//     const clickX = clientX - rect.left;
//     const width = rect.width;
//     const clampedX = Math.max(0, Math.min(clickX, width));
//     const newProgress = (clampedX / width) * 100;
//     setProgress(newProgress);
//     const raw = toBN(newProgress).div(100).times(maxValue);
//     const formatted = raw.isGreaterThan(0.0001)
//       ? raw.toFixed(4)
//       : raw.toPrecision(4);
//     setValue(formatted);
//   };

//   const handleDragEnd = () => setIsDragging(false);

//   useEffect(() => {
//     if (isDragging) {
//       document.addEventListener("mousemove", handleDragging);
//       document.addEventListener("touchmove", handleDragging);
//       document.addEventListener("mouseup", handleDragEnd);
//       document.addEventListener("touchend", handleDragEnd);
//     } else {
//       document.removeEventListener("mousemove", handleDragging);
//       document.removeEventListener("touchmove", handleDragging);
//       document.removeEventListener("mouseup", handleDragEnd);
//       document.removeEventListener("touchend", handleDragEnd);
//     }
//     return () => {};
//   }, [isDragging]);

//   const lastTick = ticks[ticks.length - 1] ?? 100;
//   const firstTick = ticks[0] ?? 0;
//   const progresCal = `${progress <= 100 ? progress : 100}%`;
//   const leftCal = `calc(${progress <= 100 ? progress : 100}% - 12px)`;

//   return (
//     <>
//       <div className={css({ flexDir: "column", alignItems: "center", w: "full", gap: "3" })}>
//         <div className={css({ flexDir: "row", alignItems: "center", gap: "1", w: "full" })}>
//           <div
//             className={css({
//               fontSize: "xs",
//               fontWeight: "normal",
//               userSelect: "none",
//               display: { base: "block", lg: "none" },
//               color: progress >= firstTick ? "white" : "woodsmoke.600",
//             })}
//           >
//             {ticks[0]}%
//           </div>
//           <div
//             ref={progressRef}
//             onClick={handleSeek}
//             className={css({
//               flexDir: "row",
//               alignItems: "center",
//               w: "full",
//               h: "10px",
//               rounded: "100px",
//               bg: "#1A201C",
//               position: "relative",
//             })}
//           >
//             <div
//               className={css({
//                 bg: "pastel-green.500",
//                 position: "absolute",
//                 top: 0,
//                 left: 0,
//                 bottom: 0,
//                 h: "full",
//                 rounded: "100px",
//               })}
//               style={{ width: progresCal }}
//             />
//             <div
//               onMouseDown={handleDragStart}
//               onTouchStart={handleDragStart}
//               className={css({
//                 flexDir: "row",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 w: { base: "6", lg: "4" },
//                 h: { base: "6", lg: "4" },
//                 bg: "pastel-green.400/50",
//                 rotate: "45deg",
//                 position: "absolute",
//                 top: "50%",
//                 transform: "translateY(-50%)",
//                 touchAction: "none",
//               })}
//               style={{
//                 left: leftCal,
//               }}
//             >
//               <div
//                 className={css({
//                   flexDir: "row",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   w: { base: "3", lg: "2" },
//                   h: { base: "3", lg: "2" },
//                   bg: "pastel-green.400",
//                 })}
//               />
//             </div>
//           </div>
//           <div
//             className={css({
//               fontSize: "xs",
//               fontWeight: "normal",
//               userSelect: "none",
//               display: { base: "block", lg: "none" },
//               color: progress >= lastTick ? "white" : "woodsmoke.600",
//             })}
//           >
//             {ticks[ticks.length - 1]}%
//           </div>
//         </div>
//         <div
//           className={css({
//             flexDir: "row",
//             alignItems: "center",
//             justifyContent: "space-between",
//             w: "full",
//             display: { base: "none", lg: "flex" },
//           })}
//         >
//           {ticks.map((tick, idx) => (
//             <div
//               key={idx}
//               className={css({
//                 fontSize: "xs",
//                 fontWeight: "normal",
//                 userSelect: "none",
//                 color: progress >= tick ? "white" : "woodsmoke.600",
//               })}
//             >
//               {tick}%
//             </div>
//           ))}
//         </div>
//       </div>
//     </>
//   );
// };

// export default Slider;
