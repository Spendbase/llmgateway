import { join } from "path";

import { config } from "dotenv";

export async function setup() {
	config({
		path: join(__dirname, "../.env"),
		override: true,
	});
}
