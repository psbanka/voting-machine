import './login.css'
import { useState, ChangeEvent } from 'react'

type AvatarImage = {
  file: File | null,
  url: string
}

const initialImage: AvatarImage = {
  file: null,
  url: ''
}

function Login(){
  const [avatarImage, setAvatarImage] = useState(initialImage);

  const handleAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    debugger
    if (e?.target?.files?.length) {
      setAvatarImage({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  }

  return (
    <div className='login'>
      <div className="item">
        <h2>Welcome back,</h2>
        <form>
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button type="submit">Login</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an account</h2>
        <form>
          <label htmlFor="file">
            <img src={avatarImage.url || "./avatar.png"} />
            Upload your avatar</label>
          <input type="file" id="file" style={{display: 'none'}} onChange={handleAvatar}/>
          <input type="text" placeholder="Username" name="username" />
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button type="submit">Sign up</button>
        </form>
      </div>
    </div>
  )
}

export default Login