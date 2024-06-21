import { droopQuota } from "../src/droop";
import { describe, expect, it } from "vitest";
describe("droopQuota", () => {
	it("should return the correct quota", () => {
		expect(droopQuota(10n, 1n)).toBe(6n);
		expect(droopQuota(10n, 2n)).toBe(4n);
		expect(droopQuota(10n, 3n)).toBe(3n);
	});
});
