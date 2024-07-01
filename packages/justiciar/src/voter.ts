import type { CtorToolkit, MoleculeType } from "atom.io"
import { moleculeFamily, selectorFamily } from "atom.io"
import { findRelations } from "atom.io/data"

import { candidateStatusSelectors } from "./candidate"
import { votes } from "./election"
import type { ElectionRoundKey } from "./election-round"

export type Voter = {
	type: `voter`
	id: string
	name: string
}

export type Ballot = {
	voterId: string
	votes: {
		[electionId: string]: string[][]
	}
}

export type ElectionRoundVoterKey = {
	electionRound: ElectionRoundKey
	voter: string
}

export const voterCurrentFavoritesSelectors = selectorFamily<
	[topTier: string[], nextTier: string[]],
	ElectionRoundVoterKey
>({
	key: `voterCurrentFavorites`,
	get:
		(keys) =>
		({ get }) => {
			const votedForCandidateKeys = get(findRelations(votes, keys.voter).candidateEntriesOfVoter)
			const stillRunning = votedForCandidateKeys.filter(([candidateKey]) => {
				const electionRoundCandidateKey = {
					electionRound: keys.electionRound,
					candidate: candidateKey,
				}

				const candidateStatus = get(candidateStatusSelectors, electionRoundCandidateKey)
				return candidateStatus === `running`
			})
			let topTier = Number.POSITIVE_INFINITY
			let nextTier = Number.POSITIVE_INFINITY
			for (const [, { tier }] of stillRunning) {
				if (tier < topTier) {
					nextTier = topTier
					topTier = tier
				}
				if (tier < nextTier && tier > topTier) {
					nextTier = tier
				}
			}
			const topFavorites = []
			const nextFavorites = []
			for (const [id, { tier }] of stillRunning) {
				if (tier === topTier) {
					topFavorites.push(id)
				} else if (tier === nextTier) {
					nextFavorites.push(id)
				}
			}
			return [topFavorites, nextFavorites]
		},
})

export class ElectionRoundVoterState {
	public constructor(
		bond: CtorToolkit<ElectionRoundVoterKey>[`bond`],
		public favorites = bond(voterCurrentFavoritesSelectors),
	) {}
}
export const electionRoundVoterMolecules = moleculeFamily({
	key: `electionRoundVoter`,
	new: class ElectionRoundVoter {
		public state: ElectionRoundVoterState
		public constructor(
			tools: CtorToolkit<ElectionRoundVoterKey>,
			public key: string,
		) {
			this.state = new ElectionRoundVoterState(tools.bond)
		}
	},
})
export type ElectionRoundVoterInstance = InstanceType<
	MoleculeType<typeof electionRoundVoterMolecules>
>
