import { TimelineClient } from "@/components/timeline/timeline-client";
import { fetchModels } from "@/lib/fetch-models";

export const metadata = {
	title: "Model Timeline - LLM API",
	description:
		"See when each model was released by its provider and when it was added to LLM API.",
};

export default async function TimelinePage() {
	const models = await fetchModels();

	return <TimelineClient models={models} />;
}
