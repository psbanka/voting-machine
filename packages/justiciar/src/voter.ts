import type { CtorToolkit, MoleculeType } from "atom.io"
import { moleculeFamily, selectorFamily } from "atom.io"
import { findRelations } from "atom.io/data"

import { candidateStatusSelectors, electionRoundCandidateMolecules } from "./candidate"
import { electionMolecules, votes } from "./election"
import type { ElectionRoundKey } from "./election-round"
import { electionRoundMolecules } from "./election-round"
import { Rational } from "./rational"
import { need } from "./refinements"

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

export type ElectionRoundVoteTotal = [candidateId: string, voteTotal: Rational]
export const electionRoundVoteTotalsSelectors = selectorFamily<
	ElectionRoundVoteTotal[],
	ElectionRoundKey
>({
	key: `electionRoundVoteTotals`,
	get:
		(keys) =>
		({ get }) => {
			const election = get(electionMolecules, keys.election)
			const electionRound = get(electionRoundMolecules, keys)

			const candidates = get(election.state.candidates.relatedKeys)
			const runningCandidates = candidates.filter((candidateKey) => {
				const candidateRoundKey = {
					electionRound: keys,
					candidate: candidateKey,
				}
				const candidate = get(electionRoundCandidateMolecules, candidateRoundKey)
				const status = get(candidate.state.status)
				return status === `running`
			})

			const voteTotals = runningCandidates
				.map<ElectionRoundVoteTotal>((candidateKey) => {
					const candidateTotalVote = new Rational()
					const candidateVoterKeys = get(findRelations(votes, candidateKey).voterKeysOfCandidate)

					const myVoteDenominators = candidateVoterKeys
						.map<bigint | null>((voterKey) => {
							const voter = electionRound.voters.get(voterKey) ?? electionRound.spawnVoter(voterKey)
							const [voterTopFavorites] = get(voter.state.favorites)
							if (!voterTopFavorites.includes(candidateKey)) {
								return null
							}
							const denominator = BigInt(voterTopFavorites.length)
							return denominator
						})
						.filter((total) => total !== null)

					for (const denominator of myVoteDenominators) {
						candidateTotalVote.add(1n, denominator)
					}
					return [candidateKey, candidateTotalVote]
				})
				.sort(([, totalA], [, totalB]) => (totalA.isGreaterThan(totalB) ? -1 : 1))
			return voteTotals
		},
})
