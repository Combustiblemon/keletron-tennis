import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';

import dbConnect from '@/lib/api/dbConnect';

export const JunkDataSchema = new mongoose.Schema({
  junkData: {
    type: String,
  },
});

const JunkData =
  (mongoose.models.JunkDataSchema as mongoose.Model<
    mongoose.Document & { junkData: string }
  >) ||
  mongoose.model<mongoose.Document & { junkData: string }>(
    'JunkData',
    JunkDataSchema
  );

export default async function handler(
  req: NextApiRequest,
  resp: NextApiResponse
) {
  try {
    await dbConnect();

    const res = await JunkData.findOne({});

    if (!res) {
      await JunkData.create({
        junkData: nanoid(),
      });

      return;
    }

    res.junkData = nanoid();

    await res.save();

    resp.status(200).end();
  } catch {
    resp.status(500).end();
  }
}
