"use client";
import { sendGTMEvent } from "@next/third-parties/google";
import { Elements } from "@stripe/react-stripe-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import * as React from "react";
import { useState } from "react";

import { useHubSpot } from "@/hooks/useHubSpot";
import { Card, CardContent } from "@/lib/components/card";
import { Stepper } from "@/lib/components/stepper";
import { toast } from "@/lib/components/use-toast";
import { useApi } from "@/lib/fetch-client";
import { useStripe } from "@/lib/stripe";

import { ApiKeyStep } from "./api-key-step";
import { CreditsStep } from "./credits-step";
import { PlanChoiceStep } from "./plan-choice-step";
import { ReferralStep } from "./referral-step";
import { WelcomeStep } from "./welcome-step";

import type { Route } from "next";

const getSteps = () => [
	{
		id: "welcome",
		title: "Welcome",
	},
	{
		id: "referral",
		title: "How did you hear about us?",
		optional: true,
	},
	{
		id: "api-key",
		title: "API Key",
	},
	{
		id: "plan-choice",
		title: "Buy Credits",
	},
	{
		id: "credits",
		title: "Credits",
		optional: true,
	},
];

export function OnboardingWizard() {
	const [activeStep, setActiveStep] = useState(0);
	const [hasSelectedPlan, setHasSelectedPlan] = useState(false);
	const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
	const [referralSource, setReferralSource] = useState<string>("");
	const [referralDetails, setReferralDetails] = useState<string>("");
	const router = useRouter();
	const posthog = usePostHog();
	const { stripe, isLoading: stripeLoading } = useStripe();
	const queryClient = useQueryClient();
	const api = useApi();
	const { submitHubSpotForm } = useHubSpot();
	const completeOnboarding = api.useMutation(
		"post",
		"/user/me/complete-onboarding",
	);

	const STEPS = getSteps();

	const finishOnboarding = async () => {
		try {
			const result = await completeOnboarding.mutateAsync({});
			const queryKey = api.queryOptions("get", "/user/me").queryKey;
			await queryClient.invalidateQueries({ queryKey });
			router.push((result.redirectTo as Route) ?? "/");
		} catch (error) {
			toast({
				title: "Error",
				description:
					(error as Error).message ||
					"Failed to complete onboarding. Please try again.",
				variant: "destructive",
			});
		}
	};

	const handleStepChange = async (step: number) => {
		// Special handling for plan choice step (now at index 3)
		if (activeStep === 3) {
			if (!hasSelectedPlan) {
				// Skip to dashboard if no plan selected
				posthog.capture("onboarding_skipped", {
					skippedAt: "plan_choice",
					referralSource: referralSource || "not_provided",
					referralDetails: referralDetails || undefined,
				});
				sendGTMEvent({
					event: "referral_source_selected",
					source_type: referralSource || "not_provided",
					source_details: referralDetails || undefined,
				});
				submitHubSpotForm(
					location.origin + "/signup",
					"Signup",
					referralSource || "not_provided",
				);

				await finishOnboarding();
				return;
			}
			// If plan is selected, continue to next step
		}

		if (step >= STEPS.length) {
			posthog.capture("onboarding_completed", {
				completedSteps: STEPS.map((step) => step.id),
				flowType: "credits",
				referralSource: referralSource || "not_provided",
				referralDetails: referralDetails || undefined,
			});
			sendGTMEvent({
				event: "referral_source_selected",
				source_type: referralSource || "not_provided",
				source_details: referralDetails,
			});
			submitHubSpotForm(
				location.origin + "/signup",
				"Signup",
				referralSource || "not_provided",
			);
			await finishOnboarding();
			return;
		}
		setActiveStep(step);
	};

	const handleSelectCredits = () => {
		setHasSelectedPlan(true);
		setActiveStep(4);
	};

	const handleReferralComplete = (source: string, details?: string) => {
		setReferralSource(source);
		if (details) {
			setReferralDetails(details);
		}
		setActiveStep(2); // Move to API Key step
	};

	// Special handling for PlanChoiceStep to pass callbacks
	const renderCurrentStep = () => {
		if (activeStep === 3) {
			return (
				<PlanChoiceStep
					onSelectCredits={handleSelectCredits}
					hasSelectedPlan={hasSelectedPlan}
				/>
			);
		}

		// For credits step, wrap with Stripe Elements
		if (activeStep === 4) {
			return stripeLoading ? (
				<div className="p-6 text-center">Loading payment form...</div>
			) : (
				<Elements stripe={stripe}>
					<CreditsStep onPaymentSuccess={() => setIsPaymentSuccessful(true)} />
				</Elements>
			);
		}

		// For other steps
		if (activeStep === 0) {
			return <WelcomeStep />;
		}

		if (activeStep === 1) {
			return <ReferralStep onComplete={handleReferralComplete} />;
		}

		if (activeStep === 2) {
			return <ApiKeyStep />;
		}

		return null;
	};

	// Customize stepper steps to show appropriate button text
	const getStepperSteps = () => {
		return STEPS.map((step, index) => ({
			...step,
			// Make plan choice step show Skip when no selection
			...(index === 3 &&
				!hasSelectedPlan && {
					customNextText: "Skip",
				}),
			// Remove optional status from credits step when payment is successful
			...(index === 4 &&
				isPaymentSuccessful && {
					optional: false,
				}),
		}));
	};

	return (
		<div className="container mx-auto max-w-3xl py-10">
			<Card>
				<CardContent className="p-6 sm:p-8">
					<Stepper
						steps={getStepperSteps()}
						activeStep={activeStep}
						onStepChange={handleStepChange}
						className="mb-6"
						nextButtonDisabled={activeStep === 4 && !isPaymentSuccessful}
					>
						{renderCurrentStep()}
					</Stepper>
				</CardContent>
			</Card>
		</div>
	);
}
