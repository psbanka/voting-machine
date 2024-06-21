import './waitForVoters.css'
import type { ElectionState, ElectionData, SystemUser, ActualVote } from '../../types'
import { useState } from 'react'
import { onSnapshot, getDoc } from 'firebase/firestore'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useEffect } from 'react'
import { useUserStore } from '../../lib/userStore'

type WaitForVotersProps = {
  targetState: ElectionState
}

function WaitForVoters({ targetState }: WaitForVotersProps){
  const { currentUser } = useUserStore();
  const [ voters, setVoters ] = useState<SystemUser[]>();
  const [ finishedVoters, setFinishedVoters ] = useState<string[]>([]);
  
  useEffect(() => {
    const unSub = onSnapshot(doc(db, 'elections', 'current'), async (res) => {
      const electionData = res.data() as ElectionData;
      const promises = electionData.users.map(async (id) => {
        const userDocRef = doc(db, 'users', id);
        const userDocSnap = await getDoc(userDocRef);
        const user = userDocSnap.data() as SystemUser;
        return user;
      });
      await Promise.all(promises).then((users) => {
        console.log(targetState, electionData.state)
        setVoters(users);
        if (targetState === 'closed') {
          electionData.users.map(async (id) => {
            // TODO: Make this onSnapshot so it updates
            const voteDocRef = doc(db, 'votes', id);
            const voteDocSnap = await getDoc(voteDocRef);
            const vote = voteDocSnap.data() as ActualVote;
            if(vote.finished){
              setFinishedVoters((prev) => [...prev, id]);
            }
            return id;
          });
        }
      });
    });
    return unSub;
  }, [currentUser?.id, targetState]);

  const handleReturn = () => {
    if (currentUser == null) return;
    setDoc(doc(db, 'votes', currentUser.id), { finished: false }, { merge: true });
  }

  const handleJoin = async () => {
    if (currentUser == null) return;
    await setDoc(doc(db, 'votes', currentUser.id), { finished: false, firstChoice: [], secondChoice: [], thirdChoice: [] });
    const electionDoc = doc(db, 'elections', 'current');
    const electionDocSnap = await getDoc(electionDoc);
    const electionData = electionDocSnap.data() as ElectionData;
    const users = electionData.users;
    if (!users.includes(currentUser.id)) {
      users.push(currentUser.id);
      setDoc(electionDoc, { users }, { merge: true });
    }
  }

  return (
    <div className='waitForVoters'>
      {
        voters?.length ? (
          <div className='waiting'>
            <h1>Waiting for voters...{targetState}</h1>
            <h2 style={{padding: '10px'}}>Current voters:</h2>
            <ul>
              {voters.map((voter) => (
                <div className='userInfo' key={voter.id}>
                  <div className="user">
                    <img src={voter?.avatar || "./avatar.png"} alt="avatar" />
                    <h2>{voter?.username}</h2>
                    {targetState !== 'closed' ? null : finishedVoters.includes(voter.id) ? <p>✅</p> : <p>❌</p>}
                  </div>
                </div>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h1>Waiting for voters...</h1>
            <p>No voters yet</p>
          </div>
        )
      }
      {targetState === 'closed' && <button className="action" onClick={handleReturn}>Return to voting</button>}
      {targetState === 'voting' && <button className="action" onClick={handleJoin}>Join the vote!</button>}
    </div>
  )
}

export default WaitForVoters