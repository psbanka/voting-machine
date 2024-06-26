import "./list.css"

import CandidateList from "./CandidateList/CandidateList"

function List(): JSX.Element {
	return (
		<div className="list">
			<CandidateList />
		</div>
	)
}

export default List
