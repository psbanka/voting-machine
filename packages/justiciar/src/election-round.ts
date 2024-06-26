import type {
	MoleculeTransactors,
	MoleculeType,
	ReadonlySelectorToken,
} from "atom.io";
import { moleculeFamily, selectorFamily } from "atom.io";
import { findRelations } from "atom.io/data";

import { Rational } from "./rational";
import { need } from "./refinements";
import { type ElectionInstance, electionMolecules } from "./election";
import {
	electionRoundVoterMolecules,
	electionRoundVoteTotalsSelectors,
} from "./voter";
import type {
	ElectionRoundVoterInstance,
	ElectionRoundVoteTotal,
} from "./voter";
import { electionRoundCandidateMolecules } from "./candidate";

export type ElectionRoundKey = { election: string; round: number };

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
					return !droopQuotaRational.isGreaterThan(total);
				})
				.map<[string, Rational]>(([key, total]) => {
					const surplus = new Rational();
					for (const [denominator, numerator] of total.entries()) {
						surplus.add(numerator, denominator);
					}
					for (const [denominator, numerator] of droopQuotaRational.entries()) {
						surplus.add(-numerator, denominator);
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
						!total.isGreaterThan(loser[1]) && !loser[1].isGreaterThan(total);
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
			const key = { electionRound: this.key, voter: voterId };
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
