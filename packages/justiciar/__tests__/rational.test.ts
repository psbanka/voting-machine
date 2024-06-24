import { describe, it, expect } from "vitest";
import { Rational } from "../src/rational";

describe("Rational", () => {
	it("should return the correct value", () => {
		const a = new Rational(1n, 2n);
		const b = new Rational(1n, 3n);
		expect(Rational.isGreater(a).than(b)).toBe(true);
		b.incorporate(1n, 3n);
		expect(Rational.isGreater(a).than(b)).toBe(false);
	});
});