import type { MoleculeTransactors } from "atom.io";
import { atomFamily, moleculeFamily, selectorFamily } from "atom.io";

import { need } from "./refinements";
import { electionMolecules, votes } from "./election";
import type { ElectionRoundKey } from "./election-round";
import { findRelations } from "atom.io/data";
import { voterCurrentFavoritesSelectors } from "./voter";

export type CandidateStatus = "running" | "elected" | "eliminated";

export type CandidateData = {
	type: "candidate";
	id: string;
	name: string;
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

export type AlternativeConsensus = {
	[candidateKey: string]: Map<bigint, bigint>;
};
export const candidateAlternativeConsensusSelectors = selectorFamily<
	AlternativeConsensus | Error,
	ElectionRoundCandidateKey
>({
	key: "candidateAlternativeConsensus",
	get:
		(keys) =>
		({ get, seek }) => {
			const votersForCandidateSelector = findRelations(
				votes,
				keys.candidate,
			).voterKeysOfCandidate;
			const votersForCandidate = get(votersForCandidateSelector);
			const alternativeConsensus: AlternativeConsensus = {};
			for (const voterKey of votersForCandidate) {
				const voterCurrentFavoritesSelector = seek(
					voterCurrentFavoritesSelectors,
					{ electionRound: keys.electionRound, voter: voterKey },
				);
				if (!voterCurrentFavoritesSelector) {
					return new Error(
						`Could not find voterCurrentFavorites for voter "${voterKey}"`,
					);
				}
				const [topTier, nextTier] = get(voterCurrentFavoritesSelector);
				const candidateIsTopTier = topTier.includes(keys.candidate);
				if (candidateIsTopTier) {
					const voterAlternatives =
						topTier.length === 1
							? nextTier
							: topTier.filter((key) => key !== keys.candidate);
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

export class ElectionRoundCandidateState {
	constructor(
		bond: MoleculeTransactors<ElectionRoundCandidateKey>[`bond`],
		public status = bond(candidateStatusSelectors),
		public alternativeConsensus = bond(candidateAlternativeConsensusSelectors),
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
