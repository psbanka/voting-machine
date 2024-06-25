import type {
	MoleculeTransactors,
	MoleculeType,
	ReadonlySelectorToken,
} from "atom.io";
import {
	atomFamily,
	moleculeFamily,
	selectorFamily,
	transaction,
} from "atom.io";
import { editRelations, findRelations, join } from "atom.io/data";

import { droopQuota } from "./droop";
import { Rational } from "./rational";
import { IMPLICIT } from "atom.io/internal";

export function need<T>(value: T): Exclude<T, undefined> {
	if (value === undefined) {
		throw new Error("Missing needed value");
	}
	return value as Exclude<T, undefined>;
}

export type ElectionPhase =
	| { name: "registration"; voterRegistrationIsOpen: true }
	| { name: "voting"; voterRegistrationIsOpen: boolean }
	| { name: "counting"; voterRegistrationIsOpen: false; currentRound: bigint };

const electionPhaseAtoms = atomFamily<ElectionPhase, string>({
	key: "electionPhase",
	default: { name: "registration", voterRegistrationIsOpen: true },
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

export type Ballot = {
	voterId: string;
	votes: {
		[electionId: string]: string[][];
	};
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

// export type AlternativeConsensus = {
// 	[candidateId: string]: Map<bigint, bigint>;
// };
// export const candidateAlternativeConsensusSelectors = selectorFamily<
// 	AlternativeConsensus | Error,
// 	string
// >({
// 	key: "candidateAlternativeConsensus",
// 	get:
// 		(candidateId) =>
// 		({ get, seek }) => {
// 			const votersForCandidateSelector = findRelations(
// 				votes,
// 				candidateId,
// 			).voterKeysOfCandidate;
// 			const votersForCandidate = get(votersForCandidateSelector);
// 			const alternativeConsensus: AlternativeConsensus = {};
// 			for (const voterId of votersForCandidate) {
// 				const voterCurrentFavoritesSelector = seek(
// 					voterCurrentFavoritesSelectors,
// 					voterId,
// 				);
// 				if (!voterCurrentFavoritesSelector) {
// 					return new Error(
// 						`Could not find voterCurrentFavorites for voter "${voterId}"`,
// 					);
// 				}
// 				const [topTier, nextTier] = get(voterCurrentFavoritesSelector);
// 				const candidateIsTopTier = topTier.includes(candidateId);
// 				if (candidateIsTopTier) {
// 					const voterAlternatives =
// 						topTier.length === 1
// 							? nextTier
// 							: topTier.filter((id) => id !== candidateId);
// 					const voteDivisor = BigInt(topTier.length * voterAlternatives.length);
// 					for (const voterAlternative of voterAlternatives) {
// 						let alternative = alternativeConsensus[voterAlternative];
// 						if (!alternative) {
// 							alternative = new Map<bigint, bigint>();
// 							alternativeConsensus[voterAlternative] = alternative;
// 						}
// 						const alternativeCurrent = alternative.get(voteDivisor) ?? 0n;
// 						alternative.set(voteDivisor, alternativeCurrent + 1n);
// 					}
// 				}
// 			}
// 			return alternativeConsensus;
// 		},
// });

export type ElectionRoundKey = { election: string; round: number };

export type CandidateStatus = "running" | "elected" | "eliminated";

export type ElectionRoundCandidateKey = {
	electionRound: ElectionRoundKey;
	candidate: string;
};
export const candidateStatusSelectors = selectorFamily<
	CandidateStatus | Error,
	ElectionRoundCandidateKey
>({
	key: "candidateStatus",
	get:
		(keys) =>
		({ get, seek }) => {
			const election = need(
				get(need(seek(electionMolecules, keys.electionRound.election))),
			);
			const previousElectionRounds = election.rounds.slice(
				0,
				keys.electionRound.round,
			);
			let status: CandidateStatus = "running";
			for (const round of previousElectionRounds) {
				const outcome = get(need(round.state.outcome));
				if (outcome instanceof Error) {
					return outcome;
				}
				if (
					outcome.candidates.some(([candidate]) => candidate === keys.candidate)
				) {
					switch (outcome.type) {
						case "elected":
							status = "elected";
							break;
						case "eliminated":
							status = "eliminated";
							break;
					}
				}
			}
			return status;
		},
});

export class ElectionRoundCandidateState {
	constructor(
		bond: MoleculeTransactors<ElectionRoundCandidateKey>[`bond`],
		public status = bond(candidateStatusSelectors),
	) {}
}
export const electionRoundCandidateMolecules = moleculeFamily({
	key: "electionRoundCandidate",
	new: class ElectionRoundCandidate {
		public state: ElectionRoundCandidateState;
		constructor(
			tools: MoleculeTransactors<ElectionRoundCandidateKey>,
			public key: ElectionRoundCandidateKey,
		) {
			this.state = new ElectionRoundCandidateState(tools.bond);
		}
	},
});

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
			const voteEntriesSelector = findRelations(
				votes,
				keys.voter,
			).candidateEntriesOfVoter;
			const voteEntries = get(voteEntriesSelector);
			const stillRunning = voteEntries.filter(([key]) => {
				const candidateAtom = seek(candidateAtoms, key);
				if (!candidateAtom) {
					return false;
				}
				const candidate = get(candidateAtom);
				return candidate.status === "running"; // remove "status" property in favor of loop-driven selector
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
			// biome-ignore lint/style/noNonNullAssertion: fine to crash here if election is somehow not found
			const election = get(seek(electionMolecules, keys.election)!)!;
			// biome-ignore lint/style/noNonNullAssertion: fine to crash here if electionRound is somehow not found, but that's fine
			const electionRound = get(seek(electionRoundMolecules, keys)!)!;

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
					const myTotal = new Rational();
					const myVoters = get(
						findRelations(votes, candidateKey).voterKeysOfCandidate,
					);
					const myVoteDenominators = myVoters
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
						myTotal.incorporate(1n, denominator);
					}
					return [candidateKey, myTotal];
				})
				.sort(([, totalA], [, totalB]) =>
					Rational.isGreater(totalA).than(totalB) ? -1 : 1,
				);
			return voteTotals;
		},
});

export type ElectionRoundOutcome =
	| { type: "elected"; candidates: [key: string, surplus: Rational][] }
	| { type: "eliminated"; candidates: string[] };
export const electionRoundOutcomeSelectors = selectorFamily<
	ElectionRoundOutcome | Error,
	ElectionRoundKey
>({
	key: "electionRoundOutcome",
	get:
		(keys) =>
		({ get, seek }) => {
			const election = need(get(need(seek(electionMolecules, keys.election))));
			const electionRound = election.rounds[keys.round];
			const voteTotals = get(need(electionRound.state.voteTotals));
			const droopQuota = get(election.state.droopQuota);
			if (droopQuota instanceof Error) {
				return new Error(
					`Election round outcome could not be calculated because droopQuota calculation failed: ${droopQuota.message}`,
				);
			}
			const droopQuotaRational = new Rational(droopQuota);
			const winners = voteTotals
				.filter(([, total]) => {
					return !Rational.isGreater(droopQuotaRational).than(total);
				})
				.map<[string, Rational]>(([key, total]) => {
					const surplus = new Rational();
					for (const [denominator, numerator] of total.entries()) {
						surplus.incorporate(numerator, denominator);
					}
					for (const [denominator, numerator] of droopQuotaRational.entries()) {
						surplus.incorporate(-numerator, denominator);
					}
					return [key, surplus];
				});

			if (winners.length > 0) {
				return { type: "elected", candidates: winners };
			}

			const losers: string[] = [];
			const loser = voteTotals.at(-1);
			if (loser) {
				losers.push(loser[0]);
				for (const [key, total] of voteTotals) {
					if (key === loser[0]) {
						continue;
					}
					const isEqual =
						!Rational.isGreater(total).than(loser[1]) &&
						!Rational.isGreater(loser[1]).than(total);
					if (isEqual) {
						losers.push(key);
					}
				}
			}
			return { type: "eliminated", candidates: losers };
		},
});

export class ElectionRoundState {
	voteTotals?: ReadonlySelectorToken<ElectionRoundVoteTotal[]>;
	outcome?: ReadonlySelectorToken<ElectionRoundOutcome | Error>;
	constructor(private bond: MoleculeTransactors<ElectionRoundKey>[`bond`]) {}
	setup() {
		this.voteTotals = this.bond(electionRoundVoteTotalsSelectors);
		this.outcome = this.bond(electionRoundOutcomeSelectors);
	}
}
export const electionRoundMolecules = moleculeFamily({
	key: "electionRound",
	new: class ElectionRound {
		public state: ElectionRoundState;
		public voters = new Map<string, ElectionRoundVoterInstance>();
		constructor(
			private tools: MoleculeTransactors<ElectionRoundKey>,
			public key: ElectionRoundKey,
			public election: ElectionInstance,
		) {
			this.state = new ElectionRoundState(this.tools.bond);
		}
		public setup() {
			const candidates = this.tools.get(
				findRelations(this.election.state.candidates, this.election.key)
					.candidateKeysOfElection,
			);
			for (const candidate of candidates) {
				this.tools.spawn(electionRoundCandidateMolecules, {
					electionRound: this.key,
					candidate,
				});
			}
			this.state.setup();
		}
		public spawnVoter(
			voterId: string,
		): InstanceType<MoleculeType<typeof electionRoundVoterMolecules>> {
			const key = { ...this.key, voter: voterId };
			const token = this.tools.spawn(electionRoundVoterMolecules, key);
			// biome-ignore lint/style/noNonNullAssertion: just created it
			const roundVoter = this.tools.get(token)!;
			this.voters.set(voterId, roundVoter);
			return roundVoter;
		}
	},
});
export type ElectionRoundInstance = InstanceType<
	MoleculeType<typeof electionRoundMolecules>
>;

export class ElectionState {
	constructor(
		bond: MoleculeTransactors<string>[`bond`],
		join: MoleculeTransactors<string>[`join`],
		public config = bond(electionConfigAtoms),
		public droopQuota = bond(droopQuotaSelectors),
		public phase = bond(electionPhaseAtoms),
		public candidates = join(electionCandidates),
		public voters = join(registeredVoters),
	) {}
}
export const electionMolecules = moleculeFamily({
	key: "election",
	new: class Election {
		public state: ElectionState;
		public rounds: ElectionRoundInstance[] = [];
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
				const phase = get(this.state.phase);
				if (phase.voterRegistrationIsOpen === false) {
					throw new Error(
						`Tried to register voter "${voterId}" but voter registration is closed`,
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
				const phase = get(this.state.phase);
				if (phase.name !== "registration") {
					throw new Error(
						`Tried to register candidate "${candidateId}" but this election is in the "${phase.name}" phase, not the "registration" phase`,
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
				const phase = get(this.state.phase);
				if (phase.name !== "voting") {
					throw new Error(
						`Tried to cast ballot for election "${this.key}" but this election is the "${phase.name}" phase, not the "voting" phase`,
					);
				}
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
						`Ballot "${voterId}" for election "${this.key}" submitted too many tiers; wanted a maximum of ${maximumTiers}, got ${votesByTier.length}`,
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
								`Ballot for election ${this.key} submitted too many votes for tier ${idx}; wanted a maximum of ${tierMax}, got ${tier.length}`,
							);
						}
						for (const candidateId of tier) {
							if (!candidateKeys.includes(candidateId)) {
								throw new Error(
									`Ballot for election ${this.key} submitted incorrect candidate at tier ${idx}; candidate "${candidateId}" not registered in election`,
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

		public beginVoting = transaction<() => void>({
			key: "beginVoting",
			do: ({ get, set }) => {
				const phase = get(this.state.phase);
				if (phase.name !== "registration") {
					throw new Error(
						`Tried to begin voting for election "${this.key}" but this election is in the "${phase.name}" phase, not the "registration" phase`,
					);
				}
				set(this.state.phase, {
					name: "voting",
					voterRegistrationIsOpen: true,
				});
			},
		});

		public closeVoterRegistration = transaction<() => void>({
			key: "closeVoterRegistration",
			do: ({ get, set }) => {
				const phase = get(this.state.phase);
				if (phase.name !== "voting") {
					throw new Error(
						`Tried to close voter registration for election "${this.key}" but this election is in the "${phase.name}" phase, not the "voting" phase`,
					);
				}
				set(this.state.phase, {
					name: "voting",
					voterRegistrationIsOpen: false,
				});
			},
		});

		public beginCounting = transaction<() => void>({
			key: "beginCounting",
			do: ({ get, set }) => {
				const phase = get(this.state.phase);
				if (phase.name !== "voting") {
					throw new Error(
						`Tried to begin counting for election "${this.key}" but this election is the "${phase.name}" phase, not the "voting" phase`,
					);
				}
				set(this.state.phase, {
					name: "counting",
					voterRegistrationIsOpen: false,
					currentRound: 0n,
				});
			},
		});

		public spawnRound(): ElectionRoundInstance {
			const keys = {
				election: this.key,
				round: this.rounds.length,
			};
			const token = this.tools.spawn(electionRoundMolecules, keys, this);
			// biome-ignore lint/style/noNonNullAssertion: just created it
			const round = this.tools.get(token)!;
			this.rounds.push(round);
			round.setup();
			return round;
		}
	},
});
export type ElectionInstance = InstanceType<
	MoleculeType<typeof electionMolecules>
>;
