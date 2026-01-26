import { CodeExample } from "@/components/landing/code-example";
import CallToAction from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import { Graph } from "@/components/landing/graph";
import { Hero } from "@/components/landing/hero";

export default function Home() {
	return (
		<>
			<Hero>{null}</Hero>
			<Features />
			<Graph />
			<CodeExample />
			<CallToAction />
			<Footer />
		</>
	);
}
