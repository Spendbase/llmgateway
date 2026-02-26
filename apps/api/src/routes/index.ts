import { OpenAPIHono } from "@hono/zod-openapi";

import { apiAuth as auth } from "@/auth/config.js";

import { activity } from "./activity.js";
import admin from "./admin.js";
import { audio } from "./audio.js";
import { banners } from "./banners.js";
import { chat } from "./chat.js";
import { chats } from "./chats.js";
import keysApi from "./keys-api.js";
import keysProvider from "./keys-provider.js";
import { logs } from "./logs.js";
import organization from "./organization.js";
import { payments } from "./payments.js";
import playground from "./playground.js";
import projects from "./projects.js";
import { publicRoutes } from "./public.js";
import team from "./team.js";
import { user } from "./user.js";
import { vouchers } from "./vouchers.js";

import type { ServerTypes } from "@/vars.js";

export const routes = new OpenAPIHono<ServerTypes>();

routes.route("/public", publicRoutes);

// Middleware to verify authentication
routes.use("/*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session?.user) {
		return c.json({ message: "Unauthorized" }, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);

	return await next();
});

routes.route("/user", user);

routes.route("/logs", logs);

routes.route("/activity", activity);

routes.route("/admin", admin);

routes.route("/keys", keysApi);
routes.route("/keys", keysProvider);
routes.route("/projects", projects);
routes.route("/playground", playground);

routes.route("/orgs", organization);
routes.route("/team", team);
routes.route("/payments", payments);
routes.route("/chat", chat);
routes.route("/chats", chats);
routes.route("/banners", banners);
routes.route("/audio", audio);
routes.route("/vouchers", vouchers);
