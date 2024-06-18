import './stateRouter.css'
import { useState } from 'react'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useEffect } from 'react'
import { useUserStore } from '../../lib/userStore'
import List from '../list/List'
import type { ElectionData, ElectionState, Votes } from '../../types'
import WaitForVoters from '../WaitForVoters/WaitForVoters'

function StateRouter(){
  const { currentUser } = useUserStore();
  const [ electionState, setElectionState ] = useState<ElectionState>('not-started');
  const [ hasVoted, setHasVoted ] = useState(false);
  
  // Election state
  useEffect(() => {
    const unSub = onSnapshot(doc(db, 'elections', 'current'), (doc) => {
      const electionData = doc.data() as ElectionData;
      setElectionState(electionData.state);
    });
    return unSub;
  }, [currentUser?.id]);

  // Votes
  useEffect(() => {
    if (currentUser == null) return;
    const unSub = onSnapshot(doc(db, 'votes', currentUser?.id), (res) => {
      const newVotes: Votes = res.data() as Votes;
      setHasVoted(newVotes.finished);
    });
    return unSub;
  }, [currentUser?.id]);

  console.log(electionState)

  let userElectionState = electionState;
  if (userElectionState === 'voting'  && hasVoted) {
    userElectionState = 'voted';
  }

  switch (userElectionState) {
    case 'not-started':
      return < WaitForVoters targetState='voting'/>
      break;
    case 'voting':
      return <List/>
    case 'voted':
      return <div className='stateRouter'>Voted</div>
    case 'closed':
      return <div className='stateRouter'>Closed</div>
    default:
      return <div className='stateRouter'>Loading...</div>
  }
}

export default StateRouter