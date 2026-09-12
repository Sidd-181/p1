function readJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || !secret.trim()) {
    throw new Error("JWT_SECRET is not set");
  }

  return secret;
}

function readJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN ?? "7d";
}

export function getJwtConfig() {
  return { jwtSecret: readJwtSecret(), jwtExpiresIn: readJwtExpiresIn() };
}
