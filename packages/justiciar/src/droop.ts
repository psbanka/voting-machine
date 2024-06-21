export function droopQuota(
	numberOfVoters: bigint,
	numberOfWinners: bigint,
): bigint {
	const winnerCountPlusOne = numberOfWinners + 1n;
	const quotientWithoutRemainder = numberOfVoters / winnerCountPlusOne;
	const quota = quotientWithoutRemainder + 1n;
	return quota;
}
