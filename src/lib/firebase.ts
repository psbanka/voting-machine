import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
	// @ts-expect-error vite env not recognized
	apiKey: import.meta.env.VITE_API_KEY,
	authDomain: `pdx-candidates-2024.firebaseapp.com`,
	projectId: `pdx-candidates-2024`,
	storageBucket: `pdx-candidates-2024.appspot.com`,
	messagingSenderId: `508108966931`,
	appId: `1:508108966931:web:43cf670fad0bfaad0383e6`,
}

initializeApp(firebaseConfig)

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()
