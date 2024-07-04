import { initializeApp, applicationDefault, App } from 'firebase-admin/app';
import { messaging } from 'firebase-admin';

export enum Topics {
  Admin = 'yoORfs84Inuo0nX4uBQKB',
  User = 'Tmg4bZ6grUj1eysRRQHVX',
  Tournament = 'v7T6sVTC1QzFXcLiwVMTA',
}

const topicMap = {
  USER: [Topics.User, Topics.Tournament],
  ADMIN: [Topics.Admin],
} as const;

let app: boolean = false;

const initApp = () => {
  if (!app) {
    initializeApp({
      credential: applicationDefault(),
    });

    app = true;
  }
};

export const sendMessageToTokens = (
  tokens: string[],
  data: Record<string, string>
) => {
  initApp();

  // Send a message to the device corresponding to the provided
  // registration token.
  messaging()
    .sendEachForMulticast({
      data,
      tokens,
    })
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.error('Error sending message:', error);
    });
};

export const sendMessageToTopic = (
  topic: Topics,
  data: Record<string, string>
) => {
  initApp();

  // Send a message to the device corresponding to the provided
  // registration token.
  messaging()
    .send({
      topic,
      data,
    })
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.error('Error sending message:', error);
    });
};

export const subscribeToTopic = async (
  tokens: string[],
  topic: Topics | Array<Topics>
) => {
  initApp();
  if (typeof topic === 'string') {
    const res = await messaging().subscribeToTopic(tokens, topic);

    if (res.errors.length > 0) {
      console.error(res.errors);
    }
  } else {
    const res = await Promise.allSettled(
      topic.map(async (t) => {
        return [await messaging().subscribeToTopic(tokens, t), t] as const;
      })
    );

    if (
      res.some(
        (r) =>
          (r.status === 'fulfilled' && r.value[0].failureCount > 0) ||
          r.status === 'rejected'
      )
    ) {
      const errors = res.map((p) => {
        if (p.status === 'rejected') {
          return [p.reason as unknown] as const;
        }

        if (p.value[0].failureCount > 0) {
          return [p.value[0].errors, p.value[1]] as const;
        }
      });

      console.error(JSON.stringify(errors, null, 2));
    }
  }
};

export const unsubscribeFromTopic = async (
  tokens: string[],
  topic: Topics | Array<Topics>
) => {
  initApp();
  if (typeof topic === 'string') {
    const res = await messaging().subscribeToTopic(tokens, topic);

    if (res.errors.length > 0) {
      console.error(res.errors);
    }
  } else {
    const res = await Promise.allSettled(
      topic.map(async (t) => {
        return [await messaging().subscribeToTopic(tokens, t), t] as const;
      })
    );

    if (
      res.some(
        (r) =>
          (r.status === 'fulfilled' && r.value[0].failureCount > 0) ||
          r.status === 'rejected'
      )
    ) {
      const errors = res.map((p) => {
        if (p.status === 'rejected') {
          return [p.reason as unknown] as const;
        }

        if (p.value[0].failureCount > 0) {
          return [p.value[0].errors, p.value[1]] as const;
        }
      });

      console.error(JSON.stringify(errors, null, 2));
    }
  }
};

export const subscribeUser = async (
  userType: keyof typeof topicMap,
  tokens?: Array<string>
) => {
  if (!tokens || !tokens.length) {
    return;
  }

  const topics = topicMap.USER as unknown as Array<Topics>;

  if (userType === 'ADMIN') {
    topics.push(...topicMap.ADMIN);
  }

  await subscribeToTopic(tokens, topics);
};

export const unsubscribeUser = async (
  userType: keyof typeof topicMap,
  tokens?: Array<string>
) => {
  if (!tokens || !tokens.length) {
    return;
  }

  const topics = topicMap.USER as unknown as Array<Topics>;

  if (userType === 'ADMIN') {
    topics.push(...topicMap.ADMIN);
  }

  await unsubscribeFromTopic(tokens, topics);
};
