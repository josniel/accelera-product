import { IconDiscord, IconGitbook, IconMedium } from "@liquity2/uikit";
import Link from "next/link";

const SOCIALS = [
  {
    href: "https://discord.gg/accelera",
    iconClass: <IconDiscord size={10} />,
    loaded: false,
  },
  {
    href: "https://medium.com/@AcceleraLabs",
    iconClass: <IconMedium size={10} />,
    loaded: false,
  },
  {
    href: "https://docs.accelera.finance/",
    iconClass: <IconGitbook size={10} />,
    loaded: false,
  },
];
import { SocialsLinks, socialsWrapper } from "./Footer.styles";

const Socials = () => {
  return (
    <div className={socialsWrapper}>
      {SOCIALS.map((social, index) => (
        <Link
          key={index}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className={SocialsLinks + " group"}
        >
          {social.iconClass}
        </Link>
      ))}
    </div>
  );
};
export default Socials;
