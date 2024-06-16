import List from './components/list/List'
import Detail from './components/detail/Detail'
import Vote from './components/vote/Vote'

const App = () => {
  return (
    <div className='container'>
      <List/>
      <Detail />
      <Vote />
    </div>
  )
}

export default App