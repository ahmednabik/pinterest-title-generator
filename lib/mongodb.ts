import mongoose from "mongoose";

// const MONGODB_URI = "mongodb+srv://ahmednabi04:lCML5GhzZ9xqpLcJ@cluster0.ozdp09h.mongodb.net/pinsearch-dv?retryWrites=true&w=majority";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}
declare global {
  var mongoose: { conn: any; promise: any } | undefined;
}

let cached = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
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