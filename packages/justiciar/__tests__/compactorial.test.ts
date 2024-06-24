import { compactorial, getPrimeFactors } from "../src/compactorial";

import { describe, it, expect } from "vitest";

describe("compactorial", () => {
	it("should return the correct value", () => {
		expect(compactorial(1n).compute()).toBe(1n);
		expect(compactorial(2n).compute()).toBe(2n);
		expect(compactorial(3n).compute()).toBe(6n);
		expect(compactorial(4n).compute()).toBe(12n);
		expect(compactorial(5n).compute()).toBe(60n);
		expect(compactorial(6n).compute()).toBe(60n);
		expect(compactorial(7n).compute()).toBe(420n);
		expect(compactorial(8n).compute()).toBe(840n);
		expect(compactorial(9n).compute()).toBe(2520n);
	});
});

describe("getFactors", () => {
	it("should return the correct factors", () => {
		expect(getPrimeFactors(1n)).toEqual(new Map([[1n, 1n]]));
		expect(getPrimeFactors(2n)).toEqual(new Map([[2n, 1n]]));
		expect(getPrimeFactors(3n)).toEqual(new Map([[3n, 1n]]));
		expect(getPrimeFactors(4n)).toEqual(new Map([[2n, 2n]]));
		expect(getPrimeFactors(5n)).toEqual(new Map([[5n, 1n]]));
		expect(getPrimeFactors(6n)).toEqual(
			new Map([
				[2n, 1n],
				[3n, 1n],
			]),
		);
	});
});
