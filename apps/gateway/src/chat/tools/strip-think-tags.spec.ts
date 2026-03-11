import { describe, expect, it } from "vitest";

import { ThinkTagStreamStripper, stripThinkTags } from "./strip-think-tags.js";

describe("stripThinkTags", () => {
	it("removes a single think block", () => {
		expect(stripThinkTags("<think>reasoning</think>answer")).toBe("answer");
	});

	it("removes think block with trailing whitespace", () => {
		expect(stripThinkTags("<think>x</think>  hello")).toBe("hello");
	});

	it("returns null for content that is only a think block", () => {
		expect(stripThinkTags("<think>only this</think>")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(stripThinkTags("")).toBeNull();
	});
});

describe("ThinkTagStreamStripper", () => {
	it("passes through plain text unchanged", () => {
		const s = new ThinkTagStreamStripper();
		expect(s.process("hello world")).toBe("hello world");
	});

	it("strips a think block in a single chunk", () => {
		const s = new ThinkTagStreamStripper();
		expect(s.process("<think>reasoning</think> answer")).toBe("answer");
	});

	it("strips a think block split across two chunks at the open tag", () => {
		const s = new ThinkTagStreamStripper();
		expect(s.process("before <thi")).toBe("before ");
		expect(s.process("nk>inside</think> after")).toBe("after");
	});

	it("strips a think block split across two chunks at the close tag", () => {
		const s = new ThinkTagStreamStripper();
		expect(s.process("<think>inside</thi")).toBe("");
		expect(s.process("nk> after")).toBe("after");
	});

	it("preserves trailing fragment of close tag across many chunks", () => {
		const s = new ThinkTagStreamStripper();
		s.process("<think>content");
		s.process("</th");
		s.process("ink");
		expect(s.process("> done")).toBe("done");
	});

	it("handles close tag split one character at a time", () => {
		const s = new ThinkTagStreamStripper();
		s.process("<think>x");
		for (const ch of "</think>") {
			s.process(ch);
		}
		expect(s.process("tail")).toBe("tail");
	});

	it("does not emit the partial close-tag fragment as output", () => {
		const s = new ThinkTagStreamStripper();
		s.process("<think>data");
		const out = s.process("</thi");
		expect(out).toBe("");
	});

	it("handles text before and after the think block split at close tag", () => {
		const s = new ThinkTagStreamStripper();
		expect(s.process("pre <think>thought</th")).toBe("pre ");
		expect(s.process("ink> post")).toBe("post");
	});

	it("multiple think blocks in sequence", () => {
		const s = new ThinkTagStreamStripper();
		expect(s.process("<think>a</think>mid<think>b</think>end")).toBe("midend");
	});
});
