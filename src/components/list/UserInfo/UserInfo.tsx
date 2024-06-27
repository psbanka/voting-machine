import "./userInfo.css"

import { useUserStore } from "../../../lib/userStore"

type UserInfoProps = {
	turnOnAdminMode: () => void
}

function UserInfo({ turnOnAdminMode }: UserInfoProps): JSX.Element {
	const { currentUser } = useUserStore()

	function handleAdmin() {
		turnOnAdminMode()
	}

	return (
		<div className="userInfo">
			<div className="user">
				<img src={currentUser?.avatar ?? `./avatar.png`} alt="avatar" />
				<h2>{currentUser?.username}</h2>
			</div>
			<div className="icons">
				<img src="./more.png" alt="more" />
				{currentUser?.admin && (
					<button type="button" onClick={handleAdmin}>
						Admin
					</button>
				)}
				<img src="./edit.png" alt="edit" />
			</div>
		</div>
	)
}

export default UserInfo
