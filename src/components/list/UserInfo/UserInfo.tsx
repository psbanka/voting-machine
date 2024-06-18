import './userInfo.css'
import { useUserStore } from '../../../lib/userStore'

function UserInfo(){
  const { currentUser } = useUserStore();

  return (
    <div className='userInfo'>
      <div className="user">
        <img src={currentUser?.avatar || "./avatar.png"} alt="avatar" />
        <h2>{currentUser?.username}</h2>
      </div>
      <div className="icons">
        <img src="./more.png" alt="more" />
        <img src="./edit.png" alt="edit" />
      </div>
    </div>
  )
}

export default UserInfo