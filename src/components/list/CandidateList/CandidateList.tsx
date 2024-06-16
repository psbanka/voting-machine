import './candidateList.css'

function CandidateList(){
  return (
    <div className="candidateList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="search" />
          <input type="text" placeholder="Search candidate" />
        </div>
        <img src="./plus.png" alt="plus" className="add"/>
      </div>

      <div className="item">
        <img src="./avatar.png" alt="avatar" />
        <div className="info">
          <h2>Rev Nat</h2>
          <p>✅ VOTED</p>
        </div>
      </div>

      <div className="item">
        <img src="./avatar.png" alt="avatar" />
        <div className="info">
          <h2>Rev Nat</h2>
          <p>✅ VOTED</p>
        </div>
      </div>

      <div className="item">
        <img src="./avatar.png" alt="avatar" />
        <div className="info">
          <span>Rev Nat</span>
          <p>✅ VOTED</p>
        </div>
      </div>
    </div>
  )
}

export default CandidateList