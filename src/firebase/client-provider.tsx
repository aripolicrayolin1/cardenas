'use client';

import React, { ReactNode } from 'react';
import { auth, db, app, rtdb } from './config';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <FirebaseProvider firebaseApp={app} firestore={db} auth={auth} database={rtdb}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
};
