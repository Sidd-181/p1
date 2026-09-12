import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getJwtConfig } from "../config/jwt.js";
import {
  createLocalUser,
  findUserByEmail,
  findUserById,
  toPublicUser,
} from "../repositories/user.repository.js";

const DEFAULT_TIMEZONE = "UTC";

function signToken(user) {
  const { jwtSecret, jwtExpiresIn } = getJwtConfig();

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone ?? DEFAULT_TIMEZONE,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn },
  );
}

export function verifyAuthToken(token) {
  const { jwtSecret } = getJwtConfig();

  return jwt.verify(token, jwtSecret);
}

export async function registerUser({ name, email, password, timezone }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw Object.assign(new Error("An account with this email already exists"), {
      status: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createLocalUser({
    name,
    email: email.toLowerCase(),
    passwordHash,
    timezone: timezone?.trim() || DEFAULT_TIMEZONE,
  });

  return {
    token: signToken(user),
    user: toPublicUser(user),
  };
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  return {
    token: signToken(user),
    user: toPublicUser(user),
  };
}

export async function getSessionUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 401 });
  }

  return toPublicUser(user);
}
