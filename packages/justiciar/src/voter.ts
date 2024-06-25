import type { MoleculeTransactors, MoleculeType } from "atom.io";
import { moleculeFamily, selectorFamily } from "atom.io";
import { findRelations } from "atom.io/data";

import { Rational } from "./rational";
import type { ElectionRoundKey } from "./election-round";
import { electionMolecules, votes } from "./election";
import {
	candidateStatusSelectors,
	electionRoundCandidateMolecules,
} from "./candidate";
import { electionRoundMolecules } from "./election-round";
import { need } from "./refinements";

export type Voter = {
	type: "voter";
	id: string;
	name: string;
};

export type Ballot = {
	voterId: string;
	votes: {
		[electionId: string]: string[][];
	};
};

export type ElectionRoundVoterKey = {
	electionRound: ElectionRoundKey;
	voter: string;
};

export const voterCurrentFavoritesSelectors = selectorFamily<
	[topTier: string[], nextTier: string[]],
	ElectionRoundVoterKey
>({
	key: "voterCurrentFavorites",
	get:
		(keys) =>
		({ get, seek }) => {
			const votedForCandidateKeys = get(
				findRelations(votes, keys.voter).candidateEntriesOfVoter,
			);
			const stillRunning = votedForCandidateKeys.filter(([candidateKey]) => {
				const electionRoundCandidateKey = {
					electionRound: keys.electionRound,
					candidate: candidateKey,
				};

				const candidateStatusToken = seek(
					candidateStatusSelectors,
					electionRoundCandidateKey,
				);
				const candidateStatus = get(need(candidateStatusToken));
				return candidateStatus === "running";
			});
			let topTier = Number.POSITIVE_INFINITY;
			let nextTier = Number.POSITIVE_INFINITY;
			for (const [, { tier }] of stillRunning) {
				if (tier < topTier) {
					nextTier = topTier;
					topTier = tier;
				}
				if (tier < nextTier && tier > topTier) {
					nextTier = tier;
				}
			}
			const topFavorites = [];
			const nextFavorites = [];
			for (const [id, { tier }] of stillRunning) {
				if (tier === topTier) {
					topFavorites.push(id);
				} else if (tier === nextTier) {
					nextFavorites.push(id);
				}
			}
			return [topFavorites, nextFavorites];
		},
});

export class ElectionRoundVoterState {
	constructor(
		bond: MoleculeTransactors<ElectionRoundVoterKey>[`bond`],
		public favorites = bond(voterCurrentFavoritesSelectors),
	) {}
}
export const electionRoundVoterMolecules = moleculeFamily({
	key: "electionRoundVoter",
	new: class ElectionRoundVoter {
		public state: ElectionRoundVoterState;
		constructor(
			tools: MoleculeTransactors<ElectionRoundVoterKey>,
			public key: string,
		) {
			this.state = new ElectionRoundVoterState(tools.bond);
		}
	},
});
export type ElectionRoundVoterInstance = InstanceType<
	MoleculeType<typeof electionRoundVoterMolecules>
>;

export type ElectionRoundVoteTotal = [candidateId: string, voteTotal: Rational];
export const electionRoundVoteTotalsSelectors = selectorFamily<
	ElectionRoundVoteTotal[],
	ElectionRoundKey
>({
	key: "electionRoundVoteTotals",
	get:
		(keys) =>
		({ get, seek }) => {
			const election = need(get(need(seek(electionMolecules, keys.election))));
			const electionRound = need(get(need(seek(electionRoundMolecules, keys))));

			const candidates = get(
				findRelations(election.state.candidates, keys.election)
					.candidateKeysOfElection,
			);
			const runningCandidates = candidates.filter((candidateKey) => {
				const candidateRoundKey = {
					electionRound: keys,
					candidate: candidateKey,
				};
				const candidate = need(
					get(need(seek(electionRoundCandidateMolecules, candidateRoundKey))),
				);
				const status = get(candidate.state.status);
				return status === "running";
			});

			const voteTotals = runningCandidates
				.map<ElectionRoundVoteTotal>((candidateKey) => {
					const candidateTotalVote = new Rational();
					const candidateVoterKeys = get(
						findRelations(votes, candidateKey).voterKeysOfCandidate,
					);

					const myVoteDenominators = candidateVoterKeys
						.map<bigint | null>((voterKey) => {
							const voter =
								electionRound.voters.get(voterKey) ??
								electionRound.spawnVoter(voterKey);
							const [voterTopFavorites] = get(voter.state.favorites);
							if (!voterTopFavorites.includes(candidateKey)) {
								return null;
							}
							const denominator = BigInt(voterTopFavorites.length);
							return denominator;
						})
						.filter((total) => total !== null);

					for (const denominator of myVoteDenominators) {
						candidateTotalVote.incorporate(1n, denominator);
					}
					return [candidateKey, candidateTotalVote];
				})
				.sort(([, totalA], [, totalB]) =>
					Rational.isGreater(totalA).than(totalB) ? -1 : 1,
				);
			return voteTotals;
		},
});
