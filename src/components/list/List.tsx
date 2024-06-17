import './list.css'
import UserInfo from './UserInfo/UserInfo'
import CandidateList from './CandidateList/CandidateList'
import type { SystemUser } from '../../types'

// type Modes = 'awaiting-start' | 'voting' | 'voted' | 'results'

type ListProps = {
  user: SystemUser
}

function List({ user }: ListProps){
  // const [ mode, setMode ] = useState<Modes>('awaiting-start');
  return (
    <div className='list'>
      <UserInfo user={user}/>
      <CandidateList />
    </div>
  )
}

export default List