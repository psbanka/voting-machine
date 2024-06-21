import type { MoleculeTransactors } from "atom.io";
import { atomFamily, moleculeFamily, selectorFamily } from "atom.io";
import { findRelations, join } from "atom.io/data";

import { droopQuota } from "./droop";
import { compactorial } from "./compactorial";

function ok<T>(value: T): value is Exclude<T, Error> {
	const isError = value instanceof Error;
	return !isError;
}

export type Candidate = {
	type: "candidate";
	id: string;
	name: string;
};
export const candidateAtoms = atomFamily<Candidate, string>({
	key: "candidate",
	default: (id) => ({ type: "candidate", name: "NO_NAME", id }),
});

export type Voter = {
	type: "voter";
	id: string;
	name: string;
};

export type ElectionConfig = {
	winnerCount: bigint;
	votingTiers: ReadonlyArray<bigint>;
};
export const electionConfigAtoms = atomFamily<ElectionConfig, string>({
	key: "electionConfig",
	default: { winnerCount: 1n, votingTiers: [1n] },
});
export const divisibleVotingPowerSelectors = selectorFamily<
	bigint | Error,
	string
>({
	key: "divisibleVotingPower",
	get:
		(id) =>
		({ get, seek }) => {
			const configAtom = seek(electionConfigAtoms, id);
			if (!configAtom) {
				return new Error(`No election config found for ${id}`);
			}
			const config = get(configAtom);
			const largestTier = config.votingTiers.reduce((a, b) => (a > b ? a : b));
			const divisibleVotingPower = compactorial(largestTier);
			return divisibleVotingPower;
		},
});

export const votes = join(
	{
		key: "votes",
		between: ["voter", "candidate"],
		cardinality: "n:n",
	},
	{
		tier: 0,
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
			const divisibleVotingPowerSelector = seek(
				divisibleVotingPowerSelectors,
				electionId,
			);
			if (!divisibleVotingPowerSelector) {
				return new Error(
					`Droop Quota calculation relies on divisibleVotingPower, which for election "${electionId}" was not found`,
				);
			}
			const divisibleVotingPower = get(divisibleVotingPowerSelector);
			if (!ok(divisibleVotingPower)) {
				return new Error(
					`Droop Quota calculation relies on divisibleVotingPower, which for election "${electionId}" had the following error: ${divisibleVotingPower.message}`,
				);
			}
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

export class ElectionState {
	constructor(
		bond: MoleculeTransactors<string>[`bond`],
		join: MoleculeTransactors<string>[`join`],
		public config = bond(electionConfigAtoms),
		public divisibleVotingPower = bond(divisibleVotingPowerSelectors),
		public droopQuota = bond(droopQuotaSelectors),
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
	},
});
