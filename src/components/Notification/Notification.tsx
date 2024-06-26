import "./notification.css"
import "react-toastify/dist/ReactToastify.css"

import { ToastContainer } from "react-toastify"

function Notification(): JSX.Element {
	return (
		<div className="notification">
			<ToastContainer position="bottom-right" />
		</div>
	)
}

export default Notification
