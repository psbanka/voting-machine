import './userInfo.css'
import type { SystemUser } from '../../../types'

type UserInfoProps = {
  user: SystemUser
}

function UserInfo({ user }: UserInfoProps){
  return (
    <div className='userInfo'>
      <div className="user">
        <img src={user.avatar || "./avatar.png"} alt="avatar" />
        <h2>{user.username}</h2>
      </div>
      <div className="icons">
        <img src="./more.png" alt="more" />
        <img src="./edit.png" alt="edit" />
      </div>
    </div>
  )
}

export default UserInfo