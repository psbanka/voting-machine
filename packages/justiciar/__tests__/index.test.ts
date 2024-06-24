import { describe, it } from "vitest";
import { electionMolecules, voterCurrentFavoritesSelectors } from "../src";
import {
	getState,
	makeMolecule,
	makeRootMolecule,
	runTransaction,
} from "atom.io";
import { findState } from "atom.io/ephemeral";

describe("divisibleVotingPowerSelectors", () => {
	it("should return the correct divisibleVotingPower", () => {
		const root = makeRootMolecule("root");
		const electionToken = makeMolecule(root, electionMolecules, "election0", {
			winnerCount: 2n,
			votingTiers: [3n, 3n, 3n],
		});
		const election = getState(electionToken);

		if (!election) {
			throw new Error("No election found");
		}

		const droopQuota = getState(election.state.droopQuota);
		console.log({ droopQuota });

		for (let i = 0; i < 1; i++) {
			runTransaction(election.registerVoter)(`voter${i}`);
		}
		for (let i = 0; i < 10; i++) {
			runTransaction(election.registerCandidate)(`candidate${i}`);
		}

		runTransaction(election.castBallot)({
			voterId: "voter0",
			votes: {
				election0: [["candidate0", "candidate1", "candidate2"]],
			},
		});
		const droopQuota1 = getState(election.state.droopQuota);
		console.log({ droopQuota1 });

		console.log(getState(findState(voterCurrentFavoritesSelectors, "voter0")));
		console.log(getState(findState(voterCurrentFavoritesSelectors, "voter0")));
	});
});
