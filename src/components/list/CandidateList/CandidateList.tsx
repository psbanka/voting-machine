import './candidateList.css'
import { useState, useEffect } from 'react'
import { onSnapshot, collection } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import AddCandidate from './AddCandidate/AddCandidate'
import type { Candidate } from '../../../types'
import CandidateDetail from '../../CandidateDetail/CandidateDetail'

function CandidateList(){
  const [editState, setEditState] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  useEffect(() => {
    const unSub = onSnapshot(collection(db, 'candidates'), (snapshot) => {
      const newCandidates: Candidate[] = snapshot?.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data()
        } as Candidate;
      });
      setCandidates(newCandidates);
    });
    return unSub;
  }, []);

  const handleClose = () => {
    setEditState(false);
  }

  const selectCandidate = (id: string | undefined) => {
    if (id == null) return;
    const candidate = candidates.find((candidate) => candidate.id === id);
    if(candidate){
      setSelectedCandidate(candidate);
    }
  }

  const handleVote = (vote: number | null) => {
    console.log(vote);
    setSelectedCandidate(null);
  }

  return (
    <div className="candidateList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="search" />
          <input type="text" placeholder="Search candidate" />
        </div>
        <img src="./plus.png" alt="plus" className="add" onClick={() => setEditState(true)}/>
      </div>
      <div>
        {editState ? <AddCandidate close={handleClose}/> : null}
        {selectedCandidate ? <CandidateDetail candidate={selectedCandidate} handleVote={handleVote}/> : null}
      {
        candidates.map((candidate) => (
          <div className="item" key={candidate.id} onClick={() => selectCandidate(candidate?.id)} >
            <img src={candidate.avatar || "./avatar.png"} alt="avatar" />
            <div className="info">
              <h2>{candidate.name}</h2>
              <p>{candidate.heading}</p>
            </div>
          </div>
        ))
      }
      </div>

{/*
      <div className="item">
        <img src="./avatar.png" alt="avatar" />
        <div className="info">
          <h2>Rev Nat</h2>
          <p>✅ VOTED</p>
        </div>
      </div>

      <div className="item">
        <img src="./avatar.png" alt="avatar" />
        <div className="info">
          <h2>Rev Nat</h2>
          <p>✅ VOTED</p>
        </div>
      </div>

      <div className="item">
        <img src="./avatar.png" alt="avatar" />
        <div className="info">
          <span>Rev Nat</span>
          <p>✅ VOTED</p>
        </div>
      </div>
    */}
    </div>
  )
}

export default CandidateList