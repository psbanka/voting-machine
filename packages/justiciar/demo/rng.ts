/**
 * A way of producing a completely deterministic sequence of "random" numbers.
 */
export class LinearCongruentialGenerator {
	private multiplier: number;
	private increment: number;
	private modulus: number;
	private currentState: number;

	public constructor(seed: number) {
		this.multiplier = 1664525;
		this.increment = 1013904223;
		this.modulus = 2 ** 32;
		this.currentState = seed;
	}

	public next(): number {
		this.currentState =
			(this.multiplier * this.currentState + this.increment) % this.modulus;
		return this.currentState / this.modulus;
	}
}
