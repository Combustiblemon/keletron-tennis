import Dexie, { EntityTable } from 'dexie';

export const db = new Dexie('TokenDatabase') as Dexie & {
  tokens: EntityTable<
    {
      email: string;
      FCMToken: string;
    },
    'email'
  >;
};

db.version(1).stores({
  tokens: 'email, FCMToken',
});
