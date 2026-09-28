import WhatIsKora from "./WhatIsKora";
import WhyKora from "./WhyKora";
import HowItWorks from "./HowItWorks";
import TrustSection from "./TrustSection";
import NamesStrip from "./NamesStrip";
import Faq from "./Faq";
import CtaSection from "./CtaSection";
import SiteFooter from "./SiteFooter";

export default function Story({ createHref }: { createHref: string }) {
  return (
    <>
      <WhatIsKora />
      <WhyKora />
      <HowItWorks />
      <TrustSection />
      <NamesStrip />
      <Faq />
      <CtaSection createHref={createHref} />
      <SiteFooter createHref={createHref} />
    </>
  );
}
