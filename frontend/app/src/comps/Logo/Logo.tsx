import Image from "next/image";
import Link from "next/link";
import { imageHeader, linkWrapperHeader, linkWrapperFooter, imageFooter } from "./Logo.styles";
import { Line } from './Line';

interface LogoProps {
  isFooter?: boolean;
}

export function Logo({ isFooter = false }: LogoProps) {
  return (
    <>
      {!isFooter ? <Link
        href="/"
        className={linkWrapperHeader}
      >
        <Image
          src="/static/images/header/accelera-logo.png"
          alt="Accelera Logo"
          width={158}
          height={47}
          className={imageHeader}
          quality={100}
          priority={true}
        />
        <Line />
      </Link> :
        <Link href="/" className={linkWrapperFooter}>
          <Image
          src="/static/images/footer/accelera-logo.png"
          alt="Accelera Logo"
          width={19.325}
          height={27.494}
          className={imageFooter}
          quality={100}
          priority={true}
        />
        </Link>
      }
    </>
  );
}
