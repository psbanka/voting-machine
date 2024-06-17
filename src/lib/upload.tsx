import { getStorage, ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage'

export async function uploadImage(file: File, userId: string): Promise<string> {
  const storage = getStorage();
  const storageRef = ref(storage, `avatars/${userId}`);
  const uploadTask = uploadBytesResumable(storageRef, file as Blob);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log(`Upload is ${progress}% done`);
    }, (error) => {
      console.error(error);
      reject(error);
    }, () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL: string) => {
        console.log('Upload is complete');
        resolve(downloadURL);
      });
    });
  });
}
