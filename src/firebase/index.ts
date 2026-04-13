'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
let memoizedSdks: any = null;

export function getSdks(firebaseApp: FirebaseApp) {
  if (memoizedSdks) return memoizedSdks;

  const auth = getAuth(firebaseApp);
  auth.languageCode = 'ko';
  auth.settings.appVerificationDisabledForTesting = false;

  memoizedSdks = {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };

  return memoizedSdks;
}

export function initializeFirebase() {
  if (typeof window === 'undefined') return null;
  
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  return getSdks(app);
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

    