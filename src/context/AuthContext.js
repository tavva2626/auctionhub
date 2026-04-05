import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, googleProvider, facebookProvider, twitterProvider } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { saveUserProfile } from '../utils/firestoreAuctions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub;
    if (auth) {
      unsub = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const userData = {
            id: fbUser.uid,
            username: fbUser.displayName || fbUser.email,
            email: fbUser.email,
            method: 'firebase',
          };
          setUser(userData);
          // Sync profile to database on login/reconnect
          saveUserProfile(fbUser.uid, userData).catch(() => {});
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => unsub && unsub();
  }, []);

  const registerUser = (username, email, password) => {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (cred) => {
        try {
          await updateProfile(cred.user, { displayName: username });
        } catch (e) {
          // ignore profile update errors
        }
        const userData = { id: cred.user.uid, username, email: cred.user.email, method: 'firebase' };
        setUser(userData); // optimistic UI update
        await saveUserProfile(cred.user.uid, userData);
        return { success: true };
      })
      .catch((err) => ({ success: false, error: err.message }));
  };

  const loginUser = (username, password) => {
    // Treat username as email
    const email = username.includes('@') ? username : `${username}`;
    return signInWithEmailAndPassword(auth, email, password)
      .then(() => ({ success: true }))
      .catch((err) => ({ success: false, error: err.message }));
  };

  const socialLogin = (method) => {
    let provider;
    if (method === 'google') provider = googleProvider;
    else if (method === 'facebook') provider = facebookProvider;
    else if (method === 'x') provider = twitterProvider;

    if (provider) {
      return signInWithPopup(auth, provider)
        .then(async (result) => {
          const u = result.user;
          const userData = { id: u.uid, username: u.displayName || u.email, email: u.email, method: 'firebase' };
          await saveUserProfile(u.uid, userData);
          return { success: true };
        })
        .catch((err) => ({ success: false, error: err.message }));
    }
    return { success: false, error: 'Unsupported provider' };
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      loginUser,
      registerUser,
      socialLogin,
      logout: async () => {
        try {
          await signOut(auth);
        } catch (e) {
          // ignore
        }
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
