import './candidateDetail.css'
import type { Candidate } from '../../types'

type CandidateDetailProps = {
  candidate: Candidate;
  handleVote: (vote: number | null) => void;
}

function CandidateDetail({ candidate, handleVote }: CandidateDetailProps){
  console.log(candidate);
  return (
    <div className='candidateDetail'>
      <img src={candidate.avatar || "./avatar.png"} alt="avatar" />
      <div className="info">
        <h2>{candidate.name}</h2>
        <h3>{candidate.heading}</h3>
        <p>{candidate.details}</p>
      </div>
      <div className="icons">
        <button onClick={() => handleVote(1)}>1️⃣</button>
        <button onClick={() => handleVote(2)}>2️⃣⃣</button>
        <button onClick={() => handleVote(3)}>3️⃣</button>
        <button onClick={() => handleVote(null)}>❌</button>
      </div>
    </div>
  )
}

export default CandidateDetail