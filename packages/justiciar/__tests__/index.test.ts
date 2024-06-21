import { describe, it } from "vitest";
import { electionMolecules } from "../src";
import { getState, makeMolecule, makeRootMolecule } from "atom.io";
import { editRelations } from "atom.io/data";

describe("divisibleVotingPowerSelectors", () => {
	it("should return the correct divisibleVotingPower", () => {
		const root = makeRootMolecule("root");
		const electionToken = makeMolecule(root, electionMolecules, "election0", {
			winnerCount: 1n,
			votingTiers: [3n, 3n, 3n],
		});
		const election = getState(electionToken);

		if (!election) {
			throw new Error("No election found");
		}

		const divisibleVotingPower = getState(election.state.divisibleVotingPower);
		const droopQuota = getState(election.state.droopQuota);
		console.log({ divisibleVotingPower, droopQuota });

		editRelations(election.state.voters, (voters) => {
			for (let i = 0; i < 100; i++) {
				voters.set("election0", `voter${i}`);
			}
		});
		editRelations(election.state.candidates, (candidates) => {
			candidates.set("election0", "candidate0");
			candidates.set("election0", "candidate1");
			candidates.set("election0", "candidate2");
		});
		const divisibleVotingPower1 = getState(election.state.divisibleVotingPower);
		const droopQuota1 = getState(election.state.droopQuota);
		console.log({ divisibleVotingPower1, droopQuota1 });
	});
});
