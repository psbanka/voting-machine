/**
 * A lossless number.
 */
export class Rational {
	protected fractionalValues = new Map<bigint, bigint>();

	protected toFloat(): number {
		const [numerator, denominator] = this.consolidate();
		return Number(numerator) / Number(denominator);
	}

	public constructor(numerator?: bigint, denominator = 1n) {
		if (numerator && denominator) {
			this.add(numerator, denominator);
		}
	}

	public add(that: Rational): Rational;
	public add(numerator: bigint, denominator: bigint): Rational;
	public add(p0: bigint | Rational, p1 = 1n): Rational {
		let numerator: bigint;
		let denominator = p1;
		if (p0 instanceof Rational) {
			[numerator, denominator] = p0.consolidate();
		} else {
			numerator = p0;
		}
		let newNumerator = numerator;
		const oldNumerator = this.fractionalValues.get(denominator);
		if (oldNumerator) {
			newNumerator = oldNumerator + numerator;
		}
		this.fractionalValues.set(denominator, newNumerator);
		return this;
	}

	public divideBy(that: Rational): Rational;
	public divideBy(otherNumerator: bigint, otherDenominator: bigint): Rational;
	public divideBy(p0: bigint | Rational, p1 = 1n): Rational {
		let otherNumerator: bigint;
		let otherDenominator = p1;
		if (p0 instanceof Rational) {
			[otherNumerator, otherDenominator] = p0.consolidate();
		} else {
			otherNumerator = p0;
		}
		const previousEntries = [...this.entries()];
		this.fractionalValues.clear();
		for (const [denominator, numerator] of previousEntries) {
			this.fractionalValues.set(
				denominator * otherNumerator,
				numerator * otherDenominator,
			);
		}
		return this;
	}

	public entries(): IterableIterator<[bigint, bigint]> {
		return this.fractionalValues.entries();
	}

	public consolidate(): [numerator: bigint, denominator: bigint] {
		let commonFactors = new PrimeFactors();
		for (const entry of this.entries()) {
			for (const member of entry) {
				if (member !== 0n && member !== 1n) {
					commonFactors = commonFactors.and(member);
				}
			}
		}
		const condensedDenominator = commonFactors.compute();
		let condensedNumerator = 0n;
		for (const [denominator, numerator] of this.fractionalValues.entries()) {
			condensedNumerator += (numerator * condensedDenominator) / denominator;
		}
		return [condensedNumerator, condensedDenominator];
	}

	public simplify(): [numerator: bigint, denominator: bigint] {
		const [numerator, denominator] = this.consolidate();
		const commonFactors = new PrimeFactors(denominator).and(numerator);
		const condensedDenominator = commonFactors.compute();
		return [
			condensedDenominator / denominator,
			condensedDenominator / numerator,
		];
	}

	public isGreaterThan(that: Rational): boolean {
		return this.toFloat() > that.toFloat();
	}
}

export class PrimeFactors {
	private factors: Map<bigint, bigint>;
	constructor(n?: bigint) {
		this.factors = new Map<bigint, bigint>();
		if (n) {
			getPrimeFactors(n, this.factors);
		}
	}
	public and(n: bigint): PrimeFactors {
		const newFactors = getPrimeFactors(n);
		for (const [newFactor, newCount] of newFactors) {
			const existingFactorCount = this.factors.get(newFactor);
			if (!existingFactorCount || existingFactorCount < newCount) {
				this.factors.set(newFactor, newCount);
			}
		}
		return this;
	}
	public compute(): bigint {
		let result = 1n;
		for (const [factor, count] of this.factors) {
			result *= factor ** count;
		}
		return result;
	}
}

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
