export function getFactors(
	n: bigint,
	factors = new Map<bigint, bigint>(),
): Map<bigint, bigint> {
	let i = 2n;
	while (i <= n) {
		if (n % i === 0n) {
			const currentCount = factors.get(i) ?? 0n;
			factors.set(i, currentCount + 1n);
			getFactors(n / i, factors);
			break;
		}
		i += 1n;
	}
	if (factors.size === 0) {
		factors.set(n, 1n);
	}
	return factors;
}

export function compactorial(n: bigint): bigint {
	let idx = n - 1n;
	const factors = getFactors(n);
	while (idx > 1n) {
		const newFactors = getFactors(idx);
		for (const [factor, count] of newFactors) {
			if (!factors.has(factor) || (factors.get(factor) ?? 0n) < count) {
				factors.set(factor, count);
			}
		}
		idx -= 1n;
	}
	let result = 1n;
	for (const [factor, count] of factors) {
		result *= factor ** count;
	}
	return result;
}
