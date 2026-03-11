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

	/**
	 * Scans buf for tag. Returns:
	 *  - found=true:  safeBuf = content before the tag, remainder = content after the tag
	 *  - found=false: safeBuf = content safe to emit, remainder = trailing partial fragment to keep
	 */
	private findTag(
		buf: string,
		tag: string,
	): { safeBuf: string; found: boolean; remainder: string } {
		const idx = buf.indexOf(tag);
		if (idx !== -1) {
			return {
				safeBuf: buf.slice(0, idx),
				found: true,
				remainder: buf.slice(idx + tag.length),
			};
		}

		const max = Math.min(buf.length, tag.length - 1);
		for (let i = max; i >= 1; i--) {
			if (tag.startsWith(buf.slice(-i))) {
				const partialStart = buf.length - i;
				return {
					safeBuf: buf.slice(0, partialStart),
					found: false,
					remainder: buf.slice(partialStart),
				};
			}
		}

		return { safeBuf: buf, found: false, remainder: "" };
	}

	public process(chunk: string): string {
		this.buffer += chunk;

		let output = "";
		let buf = this.buffer;

		while (buf.length > 0) {
			if (this.insideThinkTag) {
				const { found, remainder } = this.findTag(buf, "</think>");
				if (!found) {
					buf = remainder;
					break;
				}
				this.insideThinkTag = false;
				buf = remainder.replace(/^\s+/, "");
			} else {
				const { safeBuf, found, remainder } = this.findTag(buf, "<think>");
				output += safeBuf;
				if (!found) {
					buf = remainder;
					break;
				}
				this.insideThinkTag = true;
				buf = remainder;
			}
		}

		this.buffer = buf;
		return output;
	}
}
