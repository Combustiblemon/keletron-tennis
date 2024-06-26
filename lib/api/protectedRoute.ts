import { serialize } from 'cookie';
import { jwtVerify } from 'jose';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

import {
  generateCatchErrorResponse,
  generateSerializedTokens,
  getJwtTokenValues,
} from '@/modules/helpersBE';

const unauthorizedResponse = async (res: NextApiResponse) => {
  console.log('Unauthorized Access to the API Endpoint ❌');

  try {
    const newTokens = await generateSerializedTokens({}, `logout`);

    res.setHeader('Set-Cookie', newTokens);

    return res.status(401).json({
      success: false,
      message: 'Unauthorized Access to the API Endpoint',
      statusCode: 401,
    });
  } catch (error) {
    return generateCatchErrorResponse(res, error);
  }
};

const authorizedResponse = (
  req: NextApiRequest,
  res: NextApiResponse,
  handler: NextApiHandler
) => {
  try {
    res.setHeader(
      'Set-Cookie',
      serialize('isUserLoggedIn', 'true', {
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 365 * 10,
      })
    );

    return handler(req, res);
  } catch (error) {
    return generateCatchErrorResponse(res, error);
  }
};

const protectedRoute = async (
  req: NextApiRequest,
  res: NextApiResponse,
  handler: NextApiHandler
) => {
  try {
    const accessTokenSecret = process.env.ACCESS_JWT_SECRET || '';
    const refreshTokenSecret = process.env.REFRESH_JWT_SECRET || '';
    const { jwtAccessToken, jwtRefreshToken } = req.cookies;

    console.log('I GOT THE COOKIES FROM THE REQUEST YOU ARE OK ✅');

    if (jwtAccessToken && jwtRefreshToken) {
      try {
        const isAccessTokenValid = await jwtVerify(
          jwtAccessToken,
          new TextEncoder().encode(accessTokenSecret)
        );

        if (isAccessTokenValid) {
          console.log('Access token is valid 🥳✅');
          console.log('I AM SETTING THE IS USER LOGGED IN TO TRUE ✅');

          return authorizedResponse(req, res, handler);
        }
        //TODO : Find the correct typescript type for the error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const isAccessTokenInvalid = error?.code === 'ERR_JWS_INVALID';
        const isAccessTokenExpired = error?.code === 'ERR_JWT_EXPIRED';

        if (isAccessTokenInvalid) {
          console.log('Access token is invalid ❌');
          return await unauthorizedResponse(res);
        }

        if (isAccessTokenExpired) {
          console.log('Access token is Expired ❌');
          try {
            const isRefreshTokenValid = await jwtVerify(
              jwtRefreshToken,
              new TextEncoder().encode(refreshTokenSecret)
            );

            if (isRefreshTokenValid) {
              const { userId, rememberMe } = getJwtTokenValues(jwtAccessToken);

              const newTokens = await generateSerializedTokens(
                { userId: userId, rememberMe: rememberMe },
                `${rememberMe ? 'persist' : 'session'}`
              );

              console.log(
                'Refresh token is ok, generating new Tokens and updating client tokens ✅'
              );

              res.setHeader('Set-Cookie', newTokens);
              return handler(req, res);
            }
            //TODO : Find the correct typescript type for the error
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            console.log('Refresh token is invalid or expired😢');
            return await unauthorizedResponse(res);
          }
        }

        if (!isAccessTokenInvalid && !isAccessTokenExpired) {
          console.log(
            'Access token is not Invalid or Expired  Something else happened!!!'
          );
          return await unauthorizedResponse(res);
        }
      }
    } else {
      return await unauthorizedResponse(res);
    }
  } catch (error) {
    return generateCatchErrorResponse(res, error);
  }
};

export default protectedRoute;
