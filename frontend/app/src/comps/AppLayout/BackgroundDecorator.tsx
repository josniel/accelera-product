"use client";
import { useMemo, useState } from "react";

import { css, cx } from "@/styled-system/css";
import Image from "next/image";

const BackgroundDecorator = () => {
  const [isBackgroundDecorator1Loaded, setIsBackgroundDecorator1Loaded] = useState(false);
  const [isBackgroundDecorator2Loaded, setIsBackgroundDecorator2Loaded] = useState(false);
  const [isDecorator1Loaded, setIsDecorator1Loaded] = useState(false);
  const [isDecorator2Loaded, setIsDecorator2Loaded] = useState(false);
  const [isDecoratorMobile1Loaded, setIsDecoratorMobile1Loaded] = useState(false);
  const [isDecoratorMobile2Loaded, setIsDecoratorMobile2Loaded] = useState(false);

  const backgroundDecoratorLoaded = useMemo(() => {
    return isBackgroundDecorator1Loaded && isBackgroundDecorator2Loaded;
  }, [isBackgroundDecorator1Loaded, isBackgroundDecorator2Loaded]);

  const decoratorLoaded = useMemo(() => {
    return isDecorator1Loaded && isDecorator2Loaded;
  }, [isDecorator1Loaded, isDecorator2Loaded]);

  const decoratorMobileLoaded = useMemo(() => {
    return isDecoratorMobile1Loaded && isDecoratorMobile2Loaded;
  }, [isDecoratorMobile1Loaded, isDecoratorMobile2Loaded]);

  return (
    <>
      <Image
        src={"/static/images/background-decorator.png"}
        alt=""
        width={1565}
        height={1956}
        className={cx(
          css({
            pos: "absolute",
            top: "0",
            left: "0",
            objectFit: "cover",
            w: "100%",
            h: "100%",
            mixBlendMode: "overlay",
            userSelect: "none",
            transitionProperty: "all",
            transitionTimingFunction: "all",
            transitionDuration: "all",
          }),
          backgroundDecoratorLoaded ? css({ opacity: "0.3" }) : css({ opacity: "0" }),
        )}
        quality={100}
        priority={true}
        onLoad={() => {
          setIsBackgroundDecorator1Loaded(true);
        }}
      />
      <div
        className={css({
          pos: "absolute",
          top: "0",
          left: "0",
          w: "100%",
          h: "100%",
          opacity: 0.3,
          background: "rgba(21, 21, 21, 0.60)",
        })}
      >
      </div>
      <div
        className={css({ w: "100%", h: "100%", pos: "absolute", top: "0", left: "0", overflow: "hidden" })}
      >
        <Image
          src={"/static/images/background/decorator-1-minimalist.png"}
          alt=""
          width={742}
          height={1638}
          className={cx(
            css({
              pos: "absolute",
              top: "0",
              left: "0",
              lgDown: { display: "none" },
              userSelect: "none",
              transitionProperty: "all",
              transitionTimingFunction: "all",
              transitionDuration: "all",
            }),
            decoratorLoaded ? css({ opacity: "1" }) : css({ opacity: "0" }),
          )}
          quality={100}
          onLoad={() => {
            setIsDecorator1Loaded(true);
          }}
        />
        <Image
          src={"/static/images/background/decorator-mobile-1.webp"}
          alt=""
          width={414}
          height={524}
          className={cx(
            css({
              pos: "absolute",
              top: "0",
              left: "0",
              display: { lgDown: "block", lg: "none" },
              userSelect: "none",
              transitionProperty: "all",
              transitionTimingFunction: "all",
              transitionDuration: "all",
            }),
            decoratorMobileLoaded ? css({ opacity: "0.7" }) : css({ opacity: "0" }),
          )}
          quality={100}
          onLoad={() => {
            setIsDecoratorMobile1Loaded(true);
          }}
        />
        <Image
          src={"/static/images/background/decorator-2-minimalist.png"}
          alt=""
          width={430}
          height={1492}
          className={cx(
            css({
              pos: "absolute",
              bottom: "0",
              right: "0",
              userSelect: "none",
              xsDown: { display: "none" },
              transitionProperty: "all",
              transitionTimingFunction: "all",
              transitionDuration: "all",
            }),
            decoratorLoaded ? css({ opacity: "1" }) : css({ opacity: "0" }),
          )}
          quality={100}
          onLoad={() => {
            setIsDecorator2Loaded(true);
          }}
        />
        <Image
          src={"/static/images/background/decorator-mobile-2.webp"}
          alt=""
          width={236}
          height={767}
          className={cx(
            css({
              pos: "absolute",
              bottom: "0",
              left: "0px",
              userSelect: "none",
              w: "100%",
              xs: { display: "none" },
              transitionProperty: "all",
              transitionTimingFunction: "all",
              transitionDuration: "all",
            }),
            decoratorMobileLoaded ? css({ opacity: "0.5" }) : css({ opacity: "0" }),
          )}
          quality={100}
          onLoad={() => {
            setIsDecoratorMobile2Loaded(true);
          }}
        />
      </div>
      <Image
        src={"/static/images/background-decorator2.webp"}
        alt=""
        width={1920}
        height={1080}
        quality={100}
        priority={true}
        className={cx(
          css({
            pos: "absolute",
            top: "0",
            left: "0",
            objectFit: "cover",
            w: "100%",
            h: "100%",
            mixBlendMode: "multiply",
            userSelect: "none",
            transitionProperty: "all",
            transitionTimingFunction: "all",
            transitionDuration: "all",
            // opacity: 0.5,
          }),
          backgroundDecoratorLoaded ? css({ opacity: "0.8" }) : css({ opacity: "0" }),
        )}
        onLoad={() => {
          setIsBackgroundDecorator2Loaded(true);
        }}
      />
    </>
  );
};

export default BackgroundDecorator;
