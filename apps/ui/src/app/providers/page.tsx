import Footer from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { ModelsSupported } from "@/components/models-supported";
import { fetchModels } from "@/lib/fetch-models";

export default async function ProvidersPage() {
	const models = await fetchModels();

	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<Hero navbarOnly>{null}</Hero>
				<ModelsSupported models={models} />
			</main>
			<Footer />
		</div>
	);
}
