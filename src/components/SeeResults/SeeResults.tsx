import './seeResults.css'
import { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useEffect } from 'react'
import { useUserStore } from '../../lib/userStore'
import type { Candidate, ElectionData, Votes } from '../../types';

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

async function getVoteSummary(userId: string, newVoteSummary: VoteSummary) {
  const votesDocRef = doc(db, 'votes', userId);
  const votesDocSnap = await getDoc(votesDocRef);
  const votes = votesDocSnap.data() as Votes;
  votes.firstChoice.forEach((candidateId) => {
    if (newVoteSummary[candidateId]) {
      newVoteSummary[candidateId].firstChoice++;
    } else {
      newVoteSummary[candidateId] = { firstChoice: 1, secondChoice: 0, thirdChoice: 0, disqualified: false };
    }
  }); 
  votes.secondChoice.forEach((candidateId) => {
    if (newVoteSummary[candidateId]) {
      newVoteSummary[candidateId].secondChoice++;
    } else {
      newVoteSummary[candidateId] = { firstChoice: 0, secondChoice: 1, thirdChoice: 0, disqualified: false };
    }
  });
  votes.thirdChoice.forEach((candidateId) => {
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
  const [ page, setPage ] = useState<number>(0);
  
  useEffect(() => {
    const newVoteSummary = { ...voteSummary };
    getDoc(doc(db, 'elections', 'current'))
      .then(async (res) => {
        const electionData = res.data() as ElectionData;
        const promises = electionData.users.map(async (id) => {
          return getVoteSummary(id, newVoteSummary)
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
  }, [currentUser?.id]);

  return (
    <div className='seeResults'>
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
    </div>
  )
}

export default SeeResults