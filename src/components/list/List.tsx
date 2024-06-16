import './list.css'
import UserInfo from './UserInfo/UserInfo'
import CandidateList from './CandidateList/CandidateList'

function List(){
  return (
    <div className='list'>
      <UserInfo />
      <CandidateList />
    </div>
  )
}

export default List