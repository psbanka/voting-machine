import './list.css'
import UserInfo from './UserInfo/UserInfo'
import CandidateList from './CandidateList/CandidateList'

// type Modes = 'awaiting-start' | 'voting' | 'voted' | 'results'

function List(){
  // const [ mode, setMode ] = useState<Modes>('awaiting-start');
  return (
    <div className='list'>
      <UserInfo/>
      <CandidateList />
    </div>
  )
}

export default List