import './detail.css'

function Detail(){
  return (
    <div className='detail'>
      <div className="top">
        <div className="candidate-header">
          <img src="./avatar.png" alt="avatar" />
          <div className="texts">
            <span>John Doe</span>
            <p>The coolest guy you know</p>
          </div>
        </div>
      </div>
      <div className="center">
        <div className="candidate-detail">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec
        </div>
      </div>
      <div className="bottom">
        <div className="icons">
          <img src="./arrowUp.png" alt="vote" />
          <img src="./arrowDown.png" alt="remove-vote" />
        </div>
      </div>
    </div>
  )
}

export default Detail