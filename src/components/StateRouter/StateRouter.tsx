import './stateRouter.css'
import { useState } from 'react'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useEffect } from 'react'
import { useUserStore } from '../../lib/userStore'
import List from '../list/List'
import type { ElectionData, ElectionState, Votes } from '../../types';
import WaitForVoters from '../WaitForVoters/WaitForVoters';
import UserInfo from '../list/UserInfo/UserInfo'
import SeeResults from '../SeeResults/SeeResults'
import Admin from '../Admin/Admin'

function NextComponent(userElectionState: ElectionState, adminMode: boolean, setAdminMode: (mode: boolean) => void) { 
  if (adminMode) return <Admin exitAdminMode={() => setAdminMode(false)}/>
  switch (userElectionState) {
    case 'not-started':
      return < WaitForVoters targetState='voting'/>
      break;
    case 'voting':
      return <List/>
    case 'voted':
      return <WaitForVoters targetState='closed'/>
    case 'closed':
      return <SeeResults />
    default:
      return <div className='stateRouter'>Loading...</div>
  }
}

function StateRouter(){
  const { currentUser } = useUserStore();
  const [ electionState, setElectionState ] = useState<ElectionState>('not-started');
  const [ hasVoted, setHasVoted ] = useState(false);
  const [ adminMode, setAdminMode ] = useState(false);
  
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


  let userElectionState = electionState;
  if (userElectionState === 'voting'  && hasVoted) {
    userElectionState = 'voted';
  }

  console.log('>>>', userElectionState)
  return (
    <div className='stateRouter'>
      <UserInfo turnOnAdminMode={() => setAdminMode(true)}/>
      {NextComponent(userElectionState, adminMode, setAdminMode)}
    </div>
  )
}

export default StateRouter