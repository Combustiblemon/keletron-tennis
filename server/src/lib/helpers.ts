'server-only';

import { serialize } from 'cookie';
import { JWTPayload, SignJWT } from 'jose';

import {
  ACCESS_TOKEN_EXPIRATION_TIME_TEXT,
  JWT_ACCESS_TOKEN_NAME,
  JWT_REFRESH_TOKEN_NAME,
  REFRESH_TOKEN_EXPIRATION_TIME_TEXT,
} from '@/constants';

export const generateNoSerializedToken = async (
  payload: JWTPayload,
  expirationTime: string,
  secret: string
): Promise<string> => {
  const encodedSecret = new TextEncoder().encode(secret);

  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(encodedSecret);

  return accessToken;
};

const getTokenMaxAge = (value: 'logout' | 'persist') => {
  const maxAgeConfig = {
    logout: -1,
    persist: 60 * 60 * 24 * 365 * 10,
  };

  return maxAgeConfig[value];
};

const generateNewAccessToken = async (
  payload: JWTPayload,
  maxAge: 'logout' | 'session' | 'persist'
) => {
  const accessTokenSecret = new TextEncoder().encode(
    process.env.ACCESS_JWT_SECRET || ''
  );

  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION_TIME_TEXT)
    .sign(accessTokenSecret);

  const serializedToken = serialize(JWT_ACCESS_TOKEN_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    ...(maxAge !== 'session' && { maxAge: getTokenMaxAge(maxAge) }),
    sameSite: 'strict',
    path: '/',
  });

  return serializedToken;
};

const generateNewRefreshToken = async (
  payload: JWTPayload,
  maxAge: 'logout' | 'session' | 'persist'
) => {
  const refreshTokenSecret = new TextEncoder().encode(
    process.env.REFRESH_JWT_SECRET || ''
  );

  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION_TIME_TEXT)
    .sign(refreshTokenSecret);

  const serializedToken = serialize(JWT_REFRESH_TOKEN_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    ...(maxAge !== 'session' && { maxAge: getTokenMaxAge(maxAge) }),
    path: '/',
  });

  return serializedToken;
};

export const generateSerializedTokens = async (
  tokenDetails: JWTPayload,
  tokenType: 'persist' | 'session' | 'logout'
) => {
  const isRememberSelected = tokenType === 'persist';
  const isUserLoggedIn = tokenType !== 'logout';

  const serializedAccessToken = await generateNewAccessToken(
    tokenDetails,
    tokenType
  );

  const serializedRefreshToken = await generateNewRefreshToken(
    tokenDetails,
    tokenType
  );

  const userStatus = serialize('isUserLoggedIn', `${isUserLoggedIn}`, {
    httpOnly: false,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    ...(isRememberSelected && { maxAge: 60 * 60 * 24 * 365 * 10 }),
    path: '/',
  });

  const tokens = [serializedAccessToken, serializedRefreshToken, userStatus];

  return tokens;
};

export const isIdValid = (id: string | string[]): RegExpMatchArray | null => {
  return id?.toString()?.match(/^[0-9a-fA-F]{24}$/);
};
