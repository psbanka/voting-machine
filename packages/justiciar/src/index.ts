import type { MoleculeTransactors } from "atom.io";
import {
	atomFamily,
	moleculeFamily,
	selectorFamily,
	transaction,
} from "atom.io";
import { editRelations, findRelations, join } from "atom.io/data";

import { droopQuota } from "./droop";

export const voterRegistrationOpenAtoms = atomFamily<boolean, string>({
	key: "voterRegistrationOpen",
	default: true,
});
export const candidateRegistrationOpenAtoms = atomFamily<boolean, string>({
	key: "candidateRegistrationOpen",
	default: true,
});

export type ElectionConfig = {
	winnerCount: bigint;
	votingTiers: ReadonlyArray<bigint>;
};
export const electionConfigAtoms = atomFamily<ElectionConfig, string>({
	key: "electionConfig",
	default: { winnerCount: 1n, votingTiers: [1n] },
});

export const votes = join(
	{
		key: "votes",
		between: ["voter", "candidate"],
		cardinality: "n:n",
	},
	{
		tier: 0 as number,
	},
);

export const electionCandidates = join({
	key: "electionCandidates",
	between: ["election", "candidate"],
	cardinality: "1:n",
});

export const registeredVoters = join({
	key: "registeredVoters",
	between: ["voter", "election"],
	cardinality: "n:n",
});

export type CandidateData = {
	type: "candidate";
	id: string;
	name: string;
	status: `running` | `elected` | `eliminated`;
};
export const candidateAtoms = atomFamily<CandidateData, string>({
	key: "candidate",
	default: (id) => ({
		type: "candidate",
		name: "NO_NAME",
		id,
		status: "running",
	}),
});
export const candidateMolecules = moleculeFamily({
	key: "candidate",
	new: class Candidate {
		constructor(
			tools: MoleculeTransactors<string>,
			public key: string,
			public state = tools.bond(candidateAtoms),
		) {}
	},
});

export type Voter = {
	type: "voter";
	id: string;
	name: string;
};

export const droopQuotaSelectors = selectorFamily<bigint | Error, string>({
	key: "droopQuota",
	get:
		(electionId) =>
		({ get, seek }) => {
			const configAtom = seek(electionConfigAtoms, electionId);
			if (!configAtom) {
				return new Error(
					`Droop Quota calculation relies on electionConfig, which for election "${electionId}" was not found`,
				);
			}
			const { winnerCount } = get(configAtom);
			const registeredVoterKeysSelector = findRelations(
				registeredVoters,
				electionId,
			).voterKeysOfElection;
			const registeredVoterKeys = get(registeredVoterKeysSelector);
			const numberOfVoters = BigInt(registeredVoterKeys.length);
			const quota = droopQuota(numberOfVoters, winnerCount);
			return quota;
		},
});

export const voterCurrentFavoritesSelectors = selectorFamily<
	[topTier: string[], nextTier: string[]],
	string
>({
	key: "voterCurrentFavorites",
	get:
		(voterId) =>
		({ get, seek }) => {
			const voteEntriesSelector = findRelations(
				votes,
				voterId,
			).candidateEntriesOfVoter;
			const voteEntries = get(voteEntriesSelector);
			const stillRunning = voteEntries.filter(([key]) => {
				const candidateAtom = seek(candidateAtoms, key);
				if (!candidateAtom) {
					return false;
				}
				const candidate = get(candidateAtom);
				return candidate.status === "running";
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
			console.log({ voteEntries, stillRunning }, voteEntries[0]);
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

export type AlternativeConsensus = {
	[candidateId: string]: Map<bigint, bigint>;
};
export const candidateAlternativeConsensusSelectors = selectorFamily<
	AlternativeConsensus | Error,
	string
>({
	key: "candidateAlternativeConsensus",
	get:
		(candidateId) =>
		({ get, seek }) => {
			const votersForCandidateSelector = findRelations(
				votes,
				candidateId,
			).voterKeysOfCandidate;
			const votersForCandidate = get(votersForCandidateSelector);
			const alternativeConsensus: AlternativeConsensus = {};
			for (const voterId of votersForCandidate) {
				const voterCurrentFavoritesSelector = seek(
					voterCurrentFavoritesSelectors,
					voterId,
				);
				if (!voterCurrentFavoritesSelector) {
					return new Error(
						`Could not find voterCurrentFavorites for voter "${voterId}"`,
					);
				}
				const [topTier, nextTier] = get(voterCurrentFavoritesSelector);
				const candidateIsTopTier = topTier.includes(candidateId);
				if (candidateIsTopTier) {
					const voterAlternatives =
						topTier.length === 1
							? nextTier
							: topTier.filter((id) => id !== candidateId);
					const voteDivisor = BigInt(topTier.length * voterAlternatives.length);
					for (const voterAlternative of voterAlternatives) {
						let alternative = alternativeConsensus[voterAlternative];
						if (!alternative) {
							alternative = new Map<bigint, bigint>();
							alternativeConsensus[voterAlternative] = alternative;
						}
						const alternativeCurrent = alternative.get(voteDivisor) ?? 0n;
						alternative.set(voteDivisor, alternativeCurrent + 1n);
					}
				}
			}
			return alternativeConsensus;
		},
});

export type Ballot = {
	voterId: string;
	votes: {
		[electionId: string]: string[][];
	};
};

export class ElectionState {
	constructor(
		bond: MoleculeTransactors<string>[`bond`],
		join: MoleculeTransactors<string>[`join`],
		public config = bond(electionConfigAtoms),
		public droopQuota = bond(droopQuotaSelectors),
		public voterRegistrationOpen = bond(voterRegistrationOpenAtoms),
		public candidateRegistrationOpen = bond(candidateRegistrationOpenAtoms),
		public candidates = join(electionCandidates),
		public voters = join(registeredVoters),
	) {}
}
export const electionMolecules = moleculeFamily({
	key: "election",
	new: class Election {
		public state: ElectionState;
		constructor(
			private tools: MoleculeTransactors<string>,
			public key: string,
			config: ElectionConfig,
		) {
			this.state = new ElectionState(tools.bond, tools.join);
			this.tools.set(this.state.config, config);
		}
		public registerVoter = transaction<(voterId: string) => void>({
			key: "registerVoter",
			do: ({ get }, voterId) => {
				if (!get(this.state.voterRegistrationOpen)) {
					throw new Error(
						`Tried to register voter "${voterId}" but registration is closed`,
					);
				}
				editRelations(this.state.voters, (voters) => {
					voters.set({ election: this.key, voter: voterId });
				});
			},
		});
		public registerCandidate = transaction<(candidateId: string) => void>({
			key: "registerCandidate",
			do: ({ make, get }, candidateId) => {
				if (!get(this.state.candidateRegistrationOpen)) {
					throw new Error(
						`Tried to register candidate "${candidateId}" but registration is closed`,
					);
				}
				editRelations(this.state.candidates, (candidates) => {
					candidates.set({ election: this.key, candidate: candidateId });
				});
				make(
					{ type: "molecule", key: this.key },
					candidateMolecules,
					candidateId,
				);
			},
		});
		public castBallot = transaction<(ballot: Ballot) => void>({
			key: "castBallot",
			do: ({ get }, ballot) => {
				const { voterId } = ballot;
				const voterIndex = findRelations(
					this.state.voters,
					this.key,
				).voterKeysOfElection;
				const voterIds = get(voterIndex);
				if (!voterIds.includes(voterId)) {
					throw new Error(
						`Voter "${voterId}" not registered in election "${this.key}"`,
					);
				}

				const votesByTier = ballot.votes[this.key];

				const electionConfig = get(this.state.config);
				const maximumTiers = electionConfig.votingTiers.length;
				if (votesByTier.length > maximumTiers) {
					throw new Error(
						`Ballot "${voterId}" for election "${this.key}" submitted incorrect number of tiers; wanted ${maximumTiers}, got ${votesByTier.length}`,
					);
				}

				const candidateKeysSelector = findRelations(
					this.state.candidates,
					this.key,
				).candidateKeysOfElection;
				const candidateKeys = get(candidateKeysSelector);

				editRelations(votes, (votes) => {
					let idx = 0;
					while (idx < votesByTier.length) {
						const tier = votesByTier[idx];
						const tierMax = electionConfig.votingTiers[idx];
						if (tier.length > tierMax) {
							throw new Error(
								`Ballot for election ${this.key} submitted incorrect number of votes for tier ${idx}; wanted ${tierMax}, got ${tier.length}`,
							);
						}
						for (const candidateId of tier) {
							if (!candidateKeys.includes(candidateId)) {
								throw new Error(
									`Ballot for election ${this.key} submitted incorrect candidate for tier ${idx}; candidate "${candidateId}" not registered in election`,
								);
							}

							votes.set(
								{ candidate: candidateId, voter: voterId },
								{ tier: idx },
							);
						}
						idx++;
					}
				});

				return null;
			},
		});
	},
});
