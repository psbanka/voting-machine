import List from './components/list/List'
import Login from './components/Login/Login'
import Notification from './components/Notification/Notification'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect } from 'react'
import { auth } from './lib/firebase'
import { useUserStore } from './lib/userStore'
import SystemErrorBoundary from './components/SystemErrorBoundary/SystemErrorBoundary'

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (newUser) => {
      if (!newUser) {
        return;
      }
      fetchUserInfo(newUser.uid);
    });
    return unSub;
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className='container'>
      <SystemErrorBoundary>
      {
        currentUser ? (
          <>
            <List/>
          </>
        ) : (<Login/>)
      }
      <Notification />
      </SystemErrorBoundary>
    </div>
  )
}

export default App