import './seeResults.css'
import { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useEffect } from 'react'
import { useUserStore } from '../../lib/userStore'
import type { Candidate, ElectionData, ActualVote } from '../../types';

type VoteSummary = {
  [key: string]: {
    firstChoice: number,
    secondChoice: number,
    thirdChoice: number,
    disqualified: boolean
  }
}

type CandidateLookup = {
  [key: string]: Candidate
}

export function findWinningCandidateId(voteSummary: VoteSummary, eliminatedCandidateIds: string[]) {
  const activeCandidateIds = Object.keys(voteSummary).filter((candidateId) => !eliminatedCandidateIds.includes(candidateId));
  const firstChoiceVotes = activeCandidateIds.map((candidateId) => voteSummary[candidateId].firstChoice);
  const totalFirstChoiceVotes = firstChoiceVotes.reduce((acc, votes) => acc + votes, 0);
  const maxVotes = Math.max(...firstChoiceVotes);
  // A candidate wins if they have more than half of the total first choice votes
  if (maxVotes > totalFirstChoiceVotes / 2) {
    const winningCandidateId = activeCandidateIds.find((candidateId) => voteSummary[candidateId].firstChoice === maxVotes);
    return winningCandidateId;
  }
  return null;
}

export function eliminateCandidates(voteSummary: VoteSummary, eliminatedCandidateIds: string[]) {
  const newVoteSummary = { ...voteSummary };
  const newEliminatedCandidateIds = [...eliminatedCandidateIds];
  const candidateIds = Object.keys(newVoteSummary);
  const firstChoiceVotes = candidateIds.map((candidateId) => newVoteSummary[candidateId].firstChoice);
  const minVotes = Math.min(...firstChoiceVotes);
  const minCandidateIds = candidateIds.filter((candidateId) => newVoteSummary[candidateId].firstChoice === minVotes);
  minCandidateIds.forEach((candidateId) => {
    newVoteSummary[candidateId].disqualified = true;
    newEliminatedCandidateIds.push(candidateId);
  });
  return newEliminatedCandidateIds;
}

/**
 * when a candiate explodes, their votes go flying everywhere
 * @param votes 
 * @param eliminatedCandidateIds 
 * @returns 
 */
export function redistributeVotes(votes: ActualVote, eliminatedCandidateIds: string[]) {
  // take all the votes for the eliminated candidates and redistribute them to the next choice
  const newVotes = { ...votes };

  eliminatedCandidateIds.forEach((eliminatedCandidateId) => {
    // 1. go through the votes for each user...

    // 2. if the eliminated candidate is the second choice, make a third choice the second choice
    votes.secondChoice.forEach((candidateId, index) => {
      if (candidateId === eliminatedCandidateId) {
        // we voted for a candidate for second choice that has been eliminated
        const nextChoice = votes.thirdChoice[index]; // FIXME: this could be problematic
        if (nextChoice) {
          newVotes.secondChoice[index] = nextChoice;
          // get rid of the third choice
          newVotes.thirdChoice = newVotes.thirdChoice.filter((i: string) => i !== candidateId);
        }
      }
    })
    // 3. if the eliminated candidate is the first choice, make a second choice the first choice
    votes.firstChoice.forEach((candidateId, index) => {
      if (candidateId === eliminatedCandidateId) {
        // we voted for a candidate for first choice that has been eliminated
        const nextChoice = votes.secondChoice[index]; // FIXME: this could be problematic
        if (nextChoice) {
          newVotes.firstChoice[index] = nextChoice;
          // get rid of the second choice
          newVotes.secondChoice = newVotes.secondChoice.filter((i: string) => i !== candidateId);
        }
      }
    })
  });
  return newVotes;
}

export async function getVoteSummary(userId: string, newVoteSummary: VoteSummary, eliminatedCandidateIds: string[]) {
  const votesDocRef = doc(db, 'votes', userId);
  const votesDocSnap = await getDoc(votesDocRef);
  const votes = votesDocSnap.data() as ActualVote;

  const newVotes = redistributeVotes(votes, eliminatedCandidateIds);

  newVotes.firstChoice.forEach((candidateId) => {
    if (newVoteSummary[candidateId]) {
      newVoteSummary[candidateId].firstChoice++;
    } else {
      newVoteSummary[candidateId] = { firstChoice: 1, secondChoice: 0, thirdChoice: 0, disqualified: false };
    }
  }); 
  newVotes.secondChoice.forEach((candidateId) => {
    if (newVoteSummary[candidateId]) {
      newVoteSummary[candidateId].secondChoice++;
    } else {
      newVoteSummary[candidateId] = { firstChoice: 0, secondChoice: 1, thirdChoice: 0, disqualified: false };
    }
  });
  newVotes.thirdChoice.forEach((candidateId) => {
    if (newVoteSummary[candidateId]) {
      newVoteSummary[candidateId].thirdChoice++;
    } else {
      newVoteSummary[candidateId] = { firstChoice: 0, secondChoice: 0, thirdChoice: 1, disqualified: false };
    }
  });
  return newVoteSummary;
}

function SeeResults(){
  const { currentUser } = useUserStore();
  const [ voteSummary, setVoteSummary ] = useState<VoteSummary>({});
  const [ candidateLookup, setCandidateLookup ] = useState<CandidateLookup>({});
  const [ eliminatedCandidateIds, setEliminatedCandidateIds ] = useState<string[]>([]);
  const [ winner, setWinner ] = useState<string | null>(null);
  
  useEffect(() => {
    const newVoteSummary = { ...voteSummary };
    getDoc(doc(db, 'elections', 'current'))
      .then(async (res) => {
        const electionData = res.data() as ElectionData;
        const promises = electionData.users.map(async (id) => {
          return getVoteSummary(id, newVoteSummary, eliminatedCandidateIds)
        });
        Promise.all(promises).then(() => {
          const cPromises = Object.keys(newVoteSummary).map(async (candidateId) => {
            const res = await getDoc(doc(db, 'candidates', candidateId))
            const candidate = res.data() as Candidate;
            return candidate;
          });
          Promise.all(cPromises).then((candidates) => {
            const newCandidateLookup = candidates.reduce((acc, candidate) => {
              if (!candidate.id) return acc;
              acc[candidate.id] = candidate;
              return acc;
            }, {} as CandidateLookup);
            setCandidateLookup(newCandidateLookup);
            setVoteSummary(newVoteSummary);
          });
        });
    });
  }, [currentUser?.id, eliminatedCandidateIds]);

  useEffect(() => {
    console.log('determining winning candidate...');
    const winningCandidateId = findWinningCandidateId(voteSummary, eliminatedCandidateIds);
    if (winningCandidateId) {
      setWinner(winningCandidateId);
      console.log(`The winner is ${candidateLookup[winningCandidateId]?.name || winningCandidateId}`);
    }
  }, [voteSummary, eliminatedCandidateIds]);

  function handleProcess() {
    const newEliminatedCandidateIds = eliminateCandidates(voteSummary, eliminatedCandidateIds);
    setEliminatedCandidateIds(newEliminatedCandidateIds);
    console.log('eliminating candidate...', newEliminatedCandidateIds);
  }

  return (
    <div className='seeResults'>
      { winner && <h1>The winner is {candidateLookup[winner]?.name || winner} 🎉</h1> }
      {
        Object.entries(voteSummary).map(([candidateId, votes]) => (
          <div key={candidateId} className='candidate'>
            <h2>{candidateLookup[candidateId]?.name || candidateId}</h2>
            <p>First choice: {votes.firstChoice}</p>
            <p>Second choice: {votes.secondChoice}</p>
            <p>Third choice: {votes.thirdChoice}</p>
          </div>
        ))
      }
      <button onClick={handleProcess}>Process results</button>
    </div>
  )
}

export default SeeResults