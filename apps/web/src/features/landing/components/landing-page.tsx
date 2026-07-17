import { LandingCta } from "./landing-cta";
import { LandingFeatures } from "./landing-features";
import { LandingHero } from "./landing-hero";
import { LandingHow } from "./landing-how";
import { LandingPricing } from "./landing-pricing";

/** Nội dung landing — header/footer ở `(marketing)/layout.tsx`. */
export async function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingFeatures />
      <LandingHow />
      <LandingPricing />
      <LandingCta />
    </>
  );
}
