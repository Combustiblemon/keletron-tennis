/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { z } from 'zod';

import { onError, onSuccess } from '@/lib/api/common';
import { generateNoSerializedToken } from '@/lib/api/helpers';
import User from '@/models/User';

const resetPasswordSecret = process.env.RESET_PASSWORD_JWT_SECRET || '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'keletrontennisclub@gmail.com',
    pass: 'rdzvxmvmdaginwuk',
  },
});

const forgotPassword = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    let email;
    try {
      email = z
        .object({
          email: z.string().email(),
        })
        .parse(req.body).email;
    } catch (error) {
      return res
        .status(400)
        .json(onError(error as Error, 'forgot_password', 'POST'));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json(onError(new Error('user_not_found'), 'forgot_password'));
    }

    const resetKey: string = await generateNoSerializedToken(
      {
        email,
      },
      '5min',
      resetPasswordSecret
    );

    user.resetKey = {
      value: resetKey,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };

    await user.save();

    const emailHtml = `<div>resetKey: ${resetKey}</div>`;

    try {
      await transporter.sendMail({
        from: 'keletrontennisclub@gmail.com', // sender address
        to: email, // list of receivers
        subject: 'Password reset procedure.', // Subject line
        text: 'The link will be active for the next 5 minutes', // plain text body
        html: emailHtml,
      });
      return res.status(200).json(onSuccess(res, 'forgot_password'));
    } catch (error) {
      return res.status(500).json(onError(error as Error, 'forgot_password'));
    }
  } catch (error) {
    return res.status(500).json(onError(error as Error, 'forgot_password'));
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'POST':
      return forgotPassword(req, res);
    default:
      return res
        .status(405)
        .json(onError(new Error('method_not_allowed'), 'forgot_password'));
  }
};

export default handler;
