import Image from "next/image";
import ledgerShot from "../../../public/images/landing/ledger_lg.webp";
import homeShot from "../../../public/images/landing/home_lg.webp";
import ledgerGridShot from "../../../public/images/landing/ledger_lg_.webp";

// Center box matches the screenshots' 2414x1508 aspect, so its content is
// never cropped.
export default function HeroShots() {
  const frame =
    "relative shrink-0 overflow-hidden rounded-t-[16px] shadow-[0_-6px_16px_-10px_rgba(11,38,36,0.2),-6px_0_16px_-10px_rgba(11,38,36,0.2),6px_0_16px_-10px_rgba(11,38,36,0.2)]";
  return (
    <div className="w-full overflow-hidden px-4 pb-14 pt-6 md:px-0">
      <div className="relative flex items-start justify-center gap-5 overflow-hidden md:h-[300px] lg:h-[420px]">
        <div
          className={`${frame} hidden h-[300px] w-[300px] translate-y-14 md:block lg:h-[420px] lg:w-[440px]`}
        >
          <Image
            src={homeShot}
            alt="Kora home dashboard screenshot"
            className="h-full w-full object-cover object-right-top"
          />
        </div>
        <div
          className={`${frame} w-full max-w-[480px] md:h-[300px] lg:h-[420px] lg:max-w-[672px]`}
        >
          <Image
            src={ledgerShot}
            alt="Kora contribution ledger screenshot"
            className="h-auto w-full md:h-full md:object-cover md:object-top"
            priority
          />
        </div>
        <div
          className={`${frame} hidden h-[300px] w-[300px] translate-y-14 md:block lg:h-[420px] lg:w-[440px]`}
        >
          <Image
            src={ledgerGridShot}
            alt="Kora ledger grid close-up screenshot"
            className="h-full w-full object-cover object-left-top"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent"
        />
      </div>
    </div>
  );
}
