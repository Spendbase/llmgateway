import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import z from "zod";

import type { ServerTypes } from "@/vars.js";

export const googleWorkspace = new OpenAPIHono<ServerTypes>();

const callback = createRoute({
	method: "get",
	path: "/callback",
	summary: "Google OAuth Callback",
	request: {
		query: z.object({
			code: z.string().optional(),
			error: z.string().optional(),
		}),
	},
	responses: {
		200: {
			content: {
				"text/html": {
					schema: z.string(),
				},
			},
			description: "HTML page that posts the token back to opener",
		},
	},
});

googleWorkspace.openapi(callback, async (c) => {
	const { code, error } = c.req.valid("query");

	const renderHtml = (type: "SUCCESS" | "ERROR", payload: any) => `
    <html>
      <body>
        <script>
          window.opener.postMessage({ 
            type: "GOOGLE_WORKSPACE_${type}", 
            ...${JSON.stringify(payload)} 
          }, "*");
          window.close();
        </script>
        <p>${type === "SUCCESS" ? "Success! Closing..." : "Error occurred."}</p>
      </body>
    </html>
  `;

	if (error || !code) {
		return c.html(renderHtml("ERROR", { error: error || "No code provided" }));
	}

	try {
		const tokenParams = new URLSearchParams({
			code,
			client_id: process.env.GOOGLE_WORKSPACE_CLIENT_ID!,
			client_secret: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET!,
			redirect_uri: process.env.GOOGLE_WORKSPACE_REDIRECT_URI!,
			grant_type: "authorization_code",
		});

		const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: tokenParams.toString(),
		});

		const tokenData = await tokenRes.json();

		if (!tokenRes.ok) {
			throw new Error(
				tokenData.error_description || "Failed to exchange token",
			);
		}

		return c.html(renderHtml("SUCCESS", { token: tokenData.access_token }));
	} catch (e: any) {
		return c.html(renderHtml("ERROR", { error: e.message }));
	}
});
