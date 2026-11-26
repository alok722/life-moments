import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";
import { siteConfig } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
    },
    {
      "@type": "WebApplication",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any (web, iOS, Android)",
      browserRequirements: "Requires JavaScript",
      image: `${siteConfig.url}/icons/icon-512.png`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Birthday, anniversary and bill reminders",
        "Recurring events",
        "Email notifications",
        "AI-generated personalised wishes",
        "Installable PWA",
      ],
    },
  ],
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <LandingPage isLoggedIn={!!user} />
    </>
  );
}
