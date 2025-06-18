import type { Address, Position, PositionLoanUncommitted } from "@/src/types";
import type { ReactNode } from "react";

import { useBreakpointName } from "@/src/breakpoints";
import { ActionCard } from "@/src/comps/ActionCard/ActionCard";
import content from "@/src/content";
import { useEarnPositionsByAccount, useLoansByAccount, useStakePosition } from "@/src/liquity-utils";
import { allMockPositions } from "@/src/mock-positions";
import type { PositionEarn, PositionLoanCommitted, PositionStake } from "@/src/types";
import { css, cx } from "@/styled-system/css";
import {
  Button,
  IconArrowRight,
  IconBorrowAction,
  IconEarnAction,
  IconLeverageAction,
  IconStakeAction,
  useMediaQuery,
} from "@liquity2/uikit";
import { a, useSpring, useTransition } from "@react-spring/web";
import * as dn from "dnum";
import { useEffect, useRef, useState } from "react";
import { match, P } from "ts-pattern";
import { set } from "valibot";
import { NewPositionCard } from "./NewPositionCard";
import { PositionCard } from "./PositionCard";
import { PositionCardEarn } from "./PositionCardEarn";
import { PositionCardLoan } from "./PositionCardLoan";
import { PositionCardStake } from "./PositionCardStake";

type Mode = "positions" | "loading" | "actions";

const actionCards = [
  { type: "borrow", icon: <IconBorrowAction size={20} /> },
  { type: "leverage", icon: <IconLeverageAction size={20} /> },
  { type: "earn", icon: <IconEarnAction size={20} /> },
  { type: "stake", icon: <IconStakeAction size={20} /> },
] as const;

export function Positions({
  address,
  columns,
  showNewPositionCard = true,
  title = (mode) => (
    mode === "loading"
      ? " "
      : mode === "positions"
      ? content.home.myPositionsTitle
      : content.home.openPositionTitle
  ),
}: {
  address: null | Address;
  columns?: number;
  showNewPositionCard?: boolean;
  title?: (mode: Mode) => ReactNode;
}) {
  const [showPositions, setShowPositions] = useState(false);
  // For testing purposes, we can use mock positions
  // if (showPositions) {
  //   return (
  //     <PositionsGroup
  //       columns={columns}
  //       mode="positions"
  //       positions={allMockPositions ?? []}
  //       showNewPositionCard={showNewPositionCard}
  //       title={title}
  //     />
  //   );
  // }
  const loans = useLoansByAccount(address);
  const earnPositions = useEarnPositionsByAccount(address);
  const stakePosition = useStakePosition(address);

  const isPositionsPending = Boolean(
    address && (
      loans.isPending
      || earnPositions.isPending
      || stakePosition.isPending
    ),
  );

  const positions = isPositionsPending ? [] : [
    ...(loans.data ?? []),
    ...(earnPositions.data ?? []),
    ...(stakePosition.data && dn.gt(stakePosition.data.deposit, 0) ? [stakePosition.data] : []),
  ];

  let mode: Mode = address && positions && positions.length > 0
    ? "positions"
    : isPositionsPending
    ? "loading"
    : "actions";

  // preloading for 1 second, prevents flickering
  // since the account doesn’t reconnect instantly
  const [preLoading, setPreLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (preLoading) {
    mode = "loading";
  }

  const breakpoint = useBreakpointName();

  return (
    <PositionsGroup
      columns={showPositions
        ? (breakpoint === "sm"
          ? 1
          : breakpoint === "md"
          ? 2
          : columns)
        : columns}
      mode={showPositions ? "positions" : mode}
      positions={showPositions ? allMockPositions : positions}
      showNewPositionCard={showNewPositionCard}
      title={title}
      description={content.home.openPositionDescription}
      setShowPositions={setShowPositions}
      showPositions={showPositions}
    />
  );
}

function PositionsGroup({
  columns,
  mode,
  positions,
  title,
  showNewPositionCard,
  description = content.home.openPositionDescription,
  setShowPositions = () => {},
  showPositions = false,
}: {
  columns?: number;
  mode: Mode;
  positions: Exclude<Position, PositionLoanUncommitted>[];
  title: (mode: Mode) => ReactNode;
  showNewPositionCard: boolean;
  description?: ReactNode;
  setShowPositions?: (show: boolean) => void;
  showPositions?: boolean;
}) {
  const is2xl = useMediaQuery("(min-width: 1536px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const smDown = useMediaQuery("(max-width: 640px)");
  const actionCardsColumns = is2xl ? actionCards.length : 2;
  const positionsColumns = is2xl ? 3 : 2;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [isAtStart, setIsAtStart] = useState(true);

  columns ??= mode === "actions" ? actionCardsColumns : positionsColumns;

  const title_ = title(mode);

  const cards = match(mode)
    .returnType<Array<[number, ReactNode]>>()
    .with("positions", () => {
      let cards: Array<[number, ReactNode]> = [];

      cards = cards.concat(
        positions.map((position, index) => (
          match(position)
            .returnType<[number, ReactNode]>()
            .with({ type: P.union("borrow", "multiply") }, (p) => [
              index,
              <PositionCardLoan key={index} {...p} />,
            ])
            .with({ type: "earn" }, (p) => [
              index,
              <PositionCardEarn key={index} {...p} />,
            ])
            .with({ type: "stake" }, (p) => [
              index,
              <PositionCardStake key={index} {...p} />,
            ])
            .exhaustive()
        )) ?? [],
      );
      if (showNewPositionCard) {
        cards.push([positions.length ?? -1, <NewPositionCard key="new" />]);
      }

      return cards;
    })
    .with("loading", () => [
      [0, <PositionCard key="0" loading />],
      [1, <PositionCard key="1" loading />],
      [2, <PositionCard key="2" loading />],
    ])
    .with("actions", () => (
      (showNewPositionCard ? actionCards : []).map((item, index) => [
        index,
        <ActionCard key={index} type={item.type} icon={item.icon} />,
      ])
    ))
    .exhaustive();

  const breakpoint = useBreakpointName();

  const cardHeight = mode === "actions" ? 144 : 180;
  const rows = Math.ceil(cards.length / columns);
  const containerHeight = cardHeight * rows + (breakpoint === "sm" ? 16 : 24) * (rows - 1);

  const positionTransitions = useTransition(cards, {
    keys: ([index]) => `${mode}${index}`,
    from: {
      display: "none",
      opacity: 0,
      transform: "scale(0.9)",
    },
    enter: {
      display: "grid",
      opacity: 1,
      transform: "scale(1)",
    },
    leave: {
      display: "none",
      opacity: 0,
      transform: "scale(1)",
      immediate: true,
    },
    config: {
      mass: 1,
      tension: 1600,
      friction: 120,
    },
  });

  const animateHeight = useRef(false);
  if (mode === "loading") {
    animateHeight.current = true;
  }

  const containerSpring = useSpring({
    initial: { height: cardHeight },
    from: { height: cardHeight },
    to: { height: containerHeight },
    immediate: !animateHeight.current || mode === "loading",
    config: {
      mass: 1,
      tension: 2400,
      friction: 100,
    },
  });

  const handleRight = () => {
    if (isAtEnd) return;
    if (scrollRef.current) {
      const el = scrollRef.current;
      if (!el) return;

      const maxScrollLeft = el.scrollWidth;
      const halfScroll = maxScrollLeft / 2;
      const scrollIndividual = maxScrollLeft / positionTransitions.length;
      scrollRef.current.scrollBy({ left: smDown ? scrollIndividual : halfScroll, behavior: "smooth" });
    }
  };

  const handleLeft = () => {
    if (isAtStart) return;
    if (scrollRef.current) {
      const el = scrollRef.current;
      if (!el) return;

      const maxScrollLeft = el.scrollWidth;
      const halfScroll = maxScrollLeft / 2;
      console.log("maxScrollLeft :>> ", maxScrollLeft);
      scrollRef.current.scrollBy({ left: -halfScroll, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const maxScrollLeft = el.scrollWidth - el.offsetWidth;
      if (!maxScrollLeft) return;
      setIsAtStart(el.scrollLeft <= 1);
      setIsAtEnd(el.scrollLeft >= maxScrollLeft - 1);
    };

    el.addEventListener("scroll", handleScroll);
    handleScroll(); // set initial values

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // useEffect(() => {
  //   const el = scrollRef.current;
  //   if (!el) return;

  //   const maxScrollLeft = el.scrollWidth - el.offsetWidth;
  //   setIsAtEnd(el.scrollLeft + el.offsetWidth >= maxScrollLeft - 1);
  //   setIsAtStart(el.scrollLeft <= 1);
  // }, [scrollRef.current]);

  return (
    <div>
      <div
        className={css({
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        })}
      >
        <div
          className={css({
            width: "auto",
            maxWidth: "100%",
            lgDown: {
              borderRadius: 20,
              background: "rgba(87, 87, 87, 0.08)",
              // backdropFilter: "blur(15px)",
              display: "flex",
              padding: "20px 20px",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 10,
              alignSelf: "stretch",
              mx: 20,
            },
          })}
          style={{
            backdropFilter: isDesktop ? "blur(0px)" : "blur(15px)",
            WebkitBackdropFilter: isDesktop ? "blur(0px)" : "blur(15px)",
          }}
        >
          {title_ && (
            <div
              className={cx(
                css({
                  position: "relative",
                  fontSize: {
                    base: 24,
                    md: 26,
                    lg: 32,
                  },
                  color: "content",
                  userSelect: "none",
                }),
                showPositions && css({
                  paddingBottom: {
                    base: 16,
                    md: 20,
                    lg: 32,
                  },
                }),
              )}
            >
              {title_}
              {showPositions && (
                <div
                  className={css({
                    position: "absolute",
                    top: 16,
                    // transform: "translateY(-50%)",
                    left: -70,
                    fontSize: 14,
                    fontWeight: 400,
                    color: "content",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    _hover: {
                      color: "accent",
                    },
                  })}
                  onClick={() => setShowPositions(false)}
                >
                  <div
                    className={css({
                      transform: "rotate(180deg)",
                      width: 14,
                      height: 14,
                    })}
                  >
                    <IconArrowRight size={14} />
                  </div>
                  Back
                </div>
              )}
            </div>
          )}
          {!showPositions && (
            <div
              className={css({
                color: "contentAlt2",
                fontSize: 12,
                fontWeight: 500,
                maxW: "474px",
                paddingBottom: {
                  base: 16,
                  md: 20,
                  lg: 32,
                },
              })}
            >
              {description}
            </div>
          )}
        </div>
        {!showPositions && (
          <Button
            mode="secondary"
            label={"My Positions"}
            className={css({ w: "fit-content", px: 20 })}
            icon={<IconArrowRight size={16} />}
            onClick={() => {
              setShowPositions(true);
            }}
          />
        )}
      </div>
      <a.div
        className={css({
          position: "relative",
          width: "auto",
          maxWidth: "100%",
          lgDown: { mt: 20, display: "flex", alignItems: "center", width: "auto", mx: 20 },
        })}
        style={{
          ...(isDesktop ? containerSpring : {}),
        }}
      >
        <div
          className={css({
            display: "flex",
            padding: 5,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 100,
            height: "166",
            width: 34,
            color: "accent",
            background: "dark",
            lg: { display: "none" },
            opacity: isAtStart ? 0 : 1,
            userSelect: isAtStart ? "none" : "auto",
            // position: "absolute",
            // top: 0,
            // left: 0,
            cursor: "pointer",
          })}
          onClick={handleLeft}
          style={{ transform: "rotate(180deg)" }}
        >
          <IconArrowRight size={20} />
        </div>

        <a.div
          className={css({
            display: "grid",
            lgDown: {
              display: "flex",
              alignItems: "center",
              overflowX: "scroll",
              maxWidth: "962px",
              mx: 6,
              "&::-webkit-scrollbar": {
                display: "none !important",
              },
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
            },
            gap: {
              base: 16,
              md: 24,
            },
          })}
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            rowGap: 50,
            gridAutoRows: cardHeight,
          }}
          ref={scrollRef}
        >
          {positionTransitions((style, [_, card]) => (
            <a.div
              className={css({
                display: "grid",
                height: "100%",
                lgDown: {
                  minW: "calc(50% - 12px)",
                },
                smDown: {
                  minW: "100%",
                },
                willChange: "transform, opacity",
              })}
              style={style}
            >
              {card}
            </a.div>
          ))}
        </a.div>
        <div
          className={css({
            display: "flex",
            padding: 5,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 100,
            height: "166",
            width: 34,
            color: "accent",
            background: "dark",
            lg: { display: "none" },
            opacity: isAtEnd ? 0 : 1,
            userSelect: isAtEnd ? "none" : "auto",
            // position: "absolute",
            // top: 0,
            // right: 0,
            cursor: "pointer",
          })}
          onClick={handleRight}
        >
          <IconArrowRight size={20} />
        </div>
      </a.div>
    </div>
  );
}
