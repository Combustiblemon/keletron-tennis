import { messaging, initializeApp, credential } from 'firebase-admin';

const app = initializeApp({
  credential: credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
  ),
});

export const sendMessage = () => {
  // This registration token comes from the client FCM SDKs.
  const registrationToken = 'YOUR_REGISTRATION_TOKEN';

  const message = {
    data: {
      score: '850',
      time: '2:45',
    },
    token: registrationToken,
  };

  // Send a message to the device corresponding to the provided
  // registration token.
  app
    .messaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};
