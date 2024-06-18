import './stateRouter.css'
import { useState } from 'react'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useEffect } from 'react'
import { useUserStore } from '../../lib/userStore'
import List from '../list/List'
import type { ElectionData, ElectionState } from '../../types'
import WaitForVoters from '../WaitForVoters/WaitForVoters'

function StateRouter(){
  const { currentUser } = useUserStore();
  const [ electionState, setElectionState ] = useState<ElectionState>('not-started');
  
  useEffect(() => {
    const unSub = onSnapshot(doc(db, 'elections', 'current'), (doc) => {
      const electionData = doc.data() as ElectionData;
      setElectionState(electionData.state);
    });
    return unSub;
  }, [currentUser?.id]);

  console.log(electionState)
  switch (electionState) {
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