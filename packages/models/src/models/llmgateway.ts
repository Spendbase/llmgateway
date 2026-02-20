import type { ModelDefinition } from "@/models.js";

export const llmgatewayModels = [
	// {
	// 	id: "custom", // custom provider which expects base URL to be set
	// 	name: "Custom Model",
	// 	description: "Custom model endpoint with user-provided base URL.",
	// 	family: "llmapi",
	// 	releasedAt: new Date("2024-01-01"),
	// 	providers: [
	// 		{
	// 			providerId: "llmapi",
	// 			modelName: "custom",
	// 			inputPrice: undefined,
	// 			outputPrice: undefined,
	// 			requestPrice: undefined,
	// 			contextSize: undefined,
	// 			streaming: true,
	// 			vision: true,
	// 			tools: true,
	// 			supportedParameters: [
	// 				"temperature",
	// 				"max_tokens",
	// 				"top_p",
	// 				"frequency_penalty",
	// 				"presence_penalty",
	// 			],
	// 			jsonOutput: true,
	// 		},
	// 	],
	// },
	{
		id: "auto", // native automatic routing
		name: "Auto Route",
		description: "Automatic model routing based on request characteristics.",
		family: "llmapi",
		releasedAt: new Date("2024-01-01"),
		providers: [
			{
				providerId: "llmapi",
				modelName: "auto",
				inputPrice: undefined,
				outputPrice: undefined,
				requestPrice: undefined,
				contextSize: undefined,
				streaming: true,
				vision: true,
				tools: true,
				supportedParameters: [
					"temperature",
					"max_tokens",
					"top_p",
					"frequency_penalty",
					"presence_penalty",
				],
				jsonOutput: true,
			},
		],
	},
] as const satisfies ModelDefinition[];
