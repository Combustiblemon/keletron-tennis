import { createContext } from 'react';

export const CurrentUserContext = createContext({
  isLoggedIn: false,
});
