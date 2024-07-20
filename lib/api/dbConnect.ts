import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import mongoose, { Mongoose } from 'mongoose';
import os from 'os';
import signale from 'signale';

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  }; // This must be a `var` and not a `let / const`
}

const database = process.env.MONGODB_DB || 'dev';
const MONGODB_URI =
  process.env.MONGODB_URI?.replace('ferretdb', database)?.replace(
    './ca.crt',
    `${os.tmpdir()}/ca.crt`
  ) || '';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

if (!existsSync(`${os.tmpdir()}/ca.crt`)) {
  signale.info(`Writing temp ca.crt file to ${os.tmpdir()}/ca.crt`);
  await writeFile(
    `${os.tmpdir()}/ca.crt`,
    Buffer.from(process.env.CA_BASE64 || '', 'base64').toString('utf8')
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = { conn: null, promise: null };
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!existsSync(`${os.tmpdir()}/ca.crt`)) {
    await writeFile(
      `${os.tmpdir()}/ca.crt`,
      Buffer.from(process.env.CA_BASE64 || '', 'base64').toString('utf8')
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
