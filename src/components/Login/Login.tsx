import './login.css'
import { useState, ChangeEvent } from 'react'
import { toast } from 'react-toastify'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { uploadImage } from '../../lib/upload'

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
    if (e?.target?.files?.length) {
      setAvatarImage({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  }

  const handleLogin = (e: any) => {
    e.preventDefault();
    toast.warn("hello");
    /*
    const email = e.target.email.value;
    const password = e.target.password.value;
    */
  }

  const handleRegister = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      const emailString = email as string;
      const passwordString = password as string;
      const res = await createUserWithEmailAndPassword(auth, emailString, passwordString);
      const avatarUrl = await uploadImage(avatarImage.file as File, res.user.uid);
      await setDoc(doc(db, `users`, res.user.uid), {
        username,
        email,
        avatar: avatarUrl,
        id: res.user.uid,
      });
      await setDoc(doc(db, `userVotes`, res.user.uid), {
        username,
        votes: [],
        id: res.user.uid,
      });
      toast.success(`Account created for ${email}. You can login now.`);
    } catch (error) {
      debugger
      console.error(error);
      const anyError = error as any;
      toast.error(`Error creating account ${anyError.message}`);
    }
    console.log(username, email, password);
  }

  return (
    <div className='login'>
      <div className="item">
        <h2>Welcome back,</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button type="submit">Login</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an account</h2>
        <form onSubmit={handleRegister}>
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