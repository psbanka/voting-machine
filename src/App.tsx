import List from './components/list/List'
import Login from './components/Login/Login'
import Notification from './components/Notification/Notification'
import type { SystemUser } from './types'
import { useState } from 'react'

const App = () => {
  const [ user, setUser ] = useState<SystemUser | null>(null);


  return (
    <div className='container'>
      {
        user ? (
          <>
            <List user={user}/>
          </>
        ) : (<Login setUser={setUser}/>)
      }
      <Notification />
    </div>
  )
}

export default App