import { describe, it } from "vitest";
import { electionMolecules, need } from "../src";
import {
	getState,
	makeMolecule,
	makeRootMolecule,
	runTransaction,
} from "atom.io";

describe("core procedures", () => {
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

		for (let i = 0; i < 100; i++) {
			runTransaction(election.registerVoter)(`voter${i}`);
		}
		for (let i = 0; i < 10; i++) {
			runTransaction(election.registerCandidate)(`candidate${i}`);
		}

		runTransaction(election.beginVoting)();

		// runTransaction(election.castBallot)({
		// 	voterId: "voter0",
		// 	votes: {
		// 		election0: [["candidate0", "candidate1", "candidate2"]],
		// 	},
		// });
		const droopQuota1 = getState(election.state.droopQuota);
		console.log({ droopQuota1 });

		for (let i = 0; i < 34; i++) {
			runTransaction(election.castBallot)({
				voterId: `voter${i}`,
				votes: {
					election0: [["candidate0"], ["candidate2"], ["candidate2"]],
				},
			});
		}

		// console.log(getState(findState(voterCurrentFavoritesSelectors, "voter0")));
		// console.log(getState(findState(voterCurrentFavoritesSelectors, "voter0")));

		runTransaction(election.beginCounting)();

		const round0 = election.spawnRound();
		console.log(getState(need(round0.state.outcome)));
		const round1 = election.spawnRound();
		console.log(getState(need(round1.state.outcome)));
	});
});
