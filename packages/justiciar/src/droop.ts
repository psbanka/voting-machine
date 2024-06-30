import { selectorFamily } from "atom.io"
import { findRelations } from "atom.io/data"

import { electionConfigAtoms, registeredVoters } from "./election"

export function droopQuota(numberOfVoters: bigint, numberOfWinners: bigint): bigint {
	const numberOfWinnersPlusOne = numberOfWinners + 1n
	const quotientWithoutRemainder = numberOfVoters / numberOfWinnersPlusOne
	const quota = quotientWithoutRemainder + 1n
	return quota
}

export const droopQuotaSelectors = selectorFamily<Error | bigint, string>({
	key: `droopQuota`,
	get:
		(electionId) =>
		({ get, seek }) => {
			const configAtom = seek(electionConfigAtoms, electionId)
			if (!configAtom) {
				return new Error(
					`Droop Quota calculation relies on electionConfig, which for election "${electionId}" was not found`,
				)
			}
			const { numberOfWinners } = get(configAtom)
			const registeredVoterKeysSelector = findRelations(
				registeredVoters,
				electionId,
			).voterKeysOfElection
			const registeredVoterKeys = get(registeredVoterKeysSelector)
			const numberOfVoters = BigInt(registeredVoterKeys.length)
			const quota = droopQuota(numberOfVoters, numberOfWinners)
			return quota
		},
})
