/**
 * Strips <think>...</think> blocks from content for providers with reasoningOutput: "omit".
 * Used for non-streaming responses.
 */
export function stripThinkTags(content: string): string | null {
	return content.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim() || null;
}

/**
 * Stateful processor for stripping <think>...</think> blocks from streaming chunks.
 * Handles tags split across multiple chunks.
 */
export class ThinkTagStreamStripper {
	private insideThinkTag = false;
	private buffer = "";

	public process(chunk: string): string {
		this.buffer += chunk;

		let output = "";
		let buf = this.buffer;

		while (buf.length > 0) {
			if (this.insideThinkTag) {
				const closeIdx = buf.indexOf("</think>");
				if (closeIdx !== -1) {
					this.insideThinkTag = false;
					buf = buf.slice(closeIdx + "</think>".length).replace(/^\s+/, "");
				} else {
					buf = "";
				}
			} else {
				const openIdx = buf.indexOf("<think>");
				if (openIdx !== -1) {
					output += buf.slice(0, openIdx);
					this.insideThinkTag = true;
					buf = buf.slice(openIdx + "<think>".length);
				} else {
					const maxPrefix = Math.min(buf.length, "<think>".length - 1);
					let partialIdx = -1;
					for (let i = maxPrefix; i >= 1; i--) {
						if ("<think>".startsWith(buf.slice(-i))) {
							partialIdx = buf.length - i;
							break;
						}
					}
					if (partialIdx !== -1) {
						output += buf.slice(0, partialIdx);
						buf = buf.slice(partialIdx);
					} else {
						output += buf;
						buf = "";
					}
				}
			}
		}

		this.buffer = buf;
		return output;
	}
}
