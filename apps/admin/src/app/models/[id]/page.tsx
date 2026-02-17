import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import SignInPrompt from "@/components/auth/sign-in-prompt";
import { ModelDetailClient } from "@/components/models/model-detail-client";
import { getModel } from "@/lib/models";

export default async function ModelDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const model = await getModel(id);

	if (!model) {
		return <SignInPrompt />;
	}

	if (!model.id) {
		notFound();
	}

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
			<div className="flex items-center gap-3">
				<Link
					href="/models"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Models
				</Link>
			</div>

			<ModelDetailClient model={model} />
		</div>
	);
}
