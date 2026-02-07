import { CreditCard, ArrowRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Step } from "@/lib/components/stepper";
import { useAppConfig } from "@/lib/config";

interface PlanChoiceStepProps {
	onSelectCredits: () => void;
	hasSelectedPlan?: boolean;
}

export function PlanChoiceStep({ onSelectCredits }: PlanChoiceStepProps) {
	const config = useAppConfig();

	return (
		<Step>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2 text-center">
					<h1 className="text-2xl font-bold">Top up your account</h1>
					<p className="text-muted-foreground">
						You can top up your account now, or skip this step and do it later
					</p>
				</div>

				<div className="flex justify-center">
					<Card className="flex flex-col max-w-md w-full">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CreditCard className="h-5 w-5" />
								Buy Credits
							</CardTitle>
							<CardDescription>
								Use our managed service with pay-as-you-go credits
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col justify-between">
							<div className="space-y-3">
								<ul className="space-y-2 text-sm">
									<li className="flex items-center gap-2">
										<div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
										Simple pay-as-you-go pricing
									</li>
									<li className="flex items-center gap-2">
										<div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
										No API key management needed
									</li>
									<li className="flex items-center gap-2">
										<div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
										Built-in rate limiting and monitoring
									</li>
								</ul>
							</div>
							<Button
								className="w-full mt-4"
								onClick={onSelectCredits}
								disabled={!config.hosted}
							>
								{config.hosted ? (
									<>
										Choose Credits
										<ArrowRight className="ml-2 h-4 w-4" />
									</>
								) : (
									"Only available on llmapi.ai"
								)}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</Step>
	);
}
