import admin from 'firebase-admin';
import config from "../config";

let initialized = false;

const getApp = () => {
  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
    initialized = true;
  }
  return admin.app();
};

export const verifyFirebaseIdToken = (idToken: string) => getApp().auth().verifyIdToken(idToken);

export const FirebaseManager = { verifyFirebaseIdToken };
