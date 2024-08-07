import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

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

export default async function handler() {
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
}
