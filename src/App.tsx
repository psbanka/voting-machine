import List from './components/list/List'
import Detail from './components/detail/Detail'
import Vote from './components/vote/Vote'
import Login from './components/Login/Login'

const App = () => {
  const user = false;

  return (
    <div className='container'>
      {
        user ? (
          <>
            <List/>
            <Detail />
            <Vote />
          </>
        ) : (<Login/>)
      }
    </div>
  )
}

export default App