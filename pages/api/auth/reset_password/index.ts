import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { jwtDecode } from 'jwt-decode';
import { NextApiRequest, NextApiResponse } from 'next';

import { onError, onSuccess } from '@/lib/api/common';
import User from '@/models/User';

// What to do after password reset:

// eslint-disable-next-line consistent-return
const resetUserPassword = async (req: NextApiRequest, res: NextApiResponse) => {
  const resetKeySecret = process.env.RESET_PASSWORD_JWT_SECRET || '';
  try {
    const { resetKey, password } = JSON.parse(req.body);

    if (resetKey && password) {
      const decodedToken: { email: string } = jwtDecode(resetKey);

      try {
        const isResetKeyValid = await jwtVerify(
          resetKey,
          new TextEncoder().encode(resetKeySecret)
        );

        const { email } = decodedToken;
        const encryptedPassword = bcrypt.hashSync(password, 12);

        if (isResetKeyValid && encryptedPassword && email) {
          const user = await User.findOneAndUpdate(
            { email, 'resetKey.value': resetKey },
            {
              $set: { password: encryptedPassword, userKey: undefined },
              new: true,
            }
          );

          if (!user) {
            return res
              .status(404)
              .json(
                onError(new Error('user_not_found'), 'reset_password', 'POST')
              );
          }

          res.setHeader('Set-Cookie', []);

          return res
            .status(200)
            .json(onSuccess({ email: user.email }, 'reset_password', 'POST'));
        }

        return res
          .status(400)
          .json(
            onError(new Error('invalid_reset_key'), 'reset_password', 'POST')
          );
      } catch (error) {
        return res
          .status(400)
          .json(onError(error as Error, 'reset_password', 'POST'));
      }
    } else {
      return res
        .status(400)
        .json(onError(new Error('missing_data'), 'reset_password', 'POST'));
    }
  } catch (error) {
    return res
      .status(500)
      .json(onError(error as Error, 'reset_password', 'POST'));
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'POST':
      return resetUserPassword(req, res);
    default:
      return res
        .status(405)
        .json(onError(new Error('method_not_allowed'), 'reset_password'));
  }
};

export default handler;
