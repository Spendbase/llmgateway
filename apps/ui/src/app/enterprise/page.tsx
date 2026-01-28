import { ContactFormEnterprise } from "@/components/enterprise/contact";
import { FeaturesEnterprise } from "@/components/enterprise/features";
import { HeroEnterprise } from "@/components/enterprise/hero";
import { OpenSourceEnterprise } from "@/components/enterprise/open-source";
import { PricingEnterprise } from "@/components/enterprise/pricing";
// import { SecurityEnterprise } from "@/components/enterprise/security";
import Footer from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";

export default function EnterprisePage() {
	return (
		<div>
			<Hero navbarOnly>{null}</Hero>
			<HeroEnterprise />
			<FeaturesEnterprise />
			{/* <SecurityEnterprise /> */}
			<PricingEnterprise />
			<OpenSourceEnterprise />
			<ContactFormEnterprise />
			<Footer />
		</div>
	);
}
