import './waitForVoters.css'
import type { ElectionState, ElectionData, SystemUser } from '../../types'
import { useState } from 'react'
import { onSnapshot, getDoc } from 'firebase/firestore'
import { doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useEffect } from 'react'
import { useUserStore } from '../../lib/userStore'

type WaitForVotersProps = {
  targetState: ElectionState
}

function WaitForVoters({ targetState }: WaitForVotersProps){
  const { currentUser } = useUserStore();
  const [ voters, setVoters ] = useState<SystemUser[]>();
  
  useEffect(() => {
    const unSub = onSnapshot(doc(db, 'elections', 'current'), async (res) => {
      const electionData = res.data() as ElectionData;
      const promises = electionData.users.map(async (id) => {
        const userDocRef = doc(db, 'users', id);
        const userDocSnap = await getDoc(userDocRef);
        const user = userDocSnap.data() as SystemUser;
        return user;
      });
      Promise.all(promises).then((users) => {
        console.log(targetState, electionData.state)
        setVoters(users);
      });
    });
    return unSub;
  }, [currentUser?.id]);

  return (
    <div className='waitForVoters'>
      {
        voters?.length ? (
          <div className='waiting'>
            <h1>Waiting for voters...</h1>
            <h2 style={{padding: '10px'}}>Current voters:</h2>
            <ul>
              {voters.map((voter) => (
                <div className='userInfo'>
                  <div className="user">
                    <img src={voter?.avatar || "./avatar.png"} alt="avatar" />
                    <h2>{voter?.username}</h2>
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
    </div>
  )
}

export default WaitForVoters