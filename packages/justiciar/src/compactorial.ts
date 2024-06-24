export function getPrimeFactors(
	n: bigint,
	factors = new Map<bigint, bigint>(),
): Map<bigint, bigint> {
	let i = 2n;
	while (i <= n) {
		if (n % i === 0n) {
			const currentCount = factors.get(i) ?? 0n;
			factors.set(i, currentCount + 1n);
			getPrimeFactors(n / i, factors);
			break;
		}
		i += 1n;
	}
	if (factors.size === 0) {
		factors.set(n, 1n);
	}
	return factors;
}

export class PrimeFactors extends Map<bigint, bigint> {
	constructor(n: bigint) {
		super();
		getPrimeFactors(n, this);
	}
	public incorporate(n: bigint): void {
		const newFactors = getPrimeFactors(n);
		for (const [newFactor, newCount] of newFactors) {
			const existingFactorCount = this.get(newFactor);
			if (!existingFactorCount || existingFactorCount < newCount) {
				this.set(newFactor, newCount);
			}
		}
	}
	public compute(): bigint {
		let result = 1n;
		for (const [factor, count] of this) {
			result *= factor ** count;
		}
		return result;
	}
}

export function compactorial(n: bigint): PrimeFactors {
	// count down natural numbers from n to 2
	let idx = n - 1n;
	const factors = new PrimeFactors(n);
	while (idx > 1n) {
		factors.incorporate(idx);
		idx -= 1n;
	}
	return factors;
}
