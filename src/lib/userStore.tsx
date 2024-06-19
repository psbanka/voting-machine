import { create } from 'zustand';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { SystemUser } from '../types';

type UserStore = {
  currentUser: SystemUser | null;
  isLoading: boolean;
  fetchUserInfo: (uid: string) => Promise<void>;
};

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  isLoading: true,
  fetchUserInfo: async (uid: string) => {
    if (!uid) return set({ currentUser: null, isLoading: false });
    try {
      const userDoc = await getDoc(doc(db, `users`, uid));
      if (userDoc.exists()) {
        const userSnap = userDoc.data();
        const currentUser: SystemUser = {
          admin: userSnap.admin,
          id: userDoc.id,
          email: userSnap.email,
          username: userSnap.username,
          avatar: userSnap.avatar,
        };
        set({ currentUser, isLoading: false });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (error) {
      console.error(error);
    }
  },
}));