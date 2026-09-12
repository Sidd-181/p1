import { getPool } from "../db/pool.js";

const DEFAULT_TIMEZONE = "UTC";

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    timezone: row.timezone ?? DEFAULT_TIMEZONE,
    createdAt: row.created_at,
  };
}

export function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone ?? DEFAULT_TIMEZONE,
  };
}

export async function createLocalUser(input) {
  const timezone = input.timezone?.trim() || DEFAULT_TIMEZONE;

  const result = await getPool().query(
    `
        INSERT INTO users (email, name, password_hash, timezone)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
    [input.email, input.name, input.passwordHash, timezone],
  );

  return mapUser(result.rows[0]);
}

export async function findUserByEmail(email) {
  const result = await getPool().query(
    `
        SELECT *
        FROM users
        WHERE lower(email) = lower($1)
        LIMIT 1
        `,
    [email],
  );

  return mapUser(result.rows[0]);
}

export async function findUserById(id) {
  const result = await getPool().query(
    `
        SELECT *
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
    [id],
  );

  return mapUser(result.rows[0]);
}

export async function updateUserTimezone(userId, timezone) {
  const result = await getPool().query(
    `
        UPDATE users
        SET timezone = $2
        WHERE id = $1
        RETURNING *
        `,
    [userId, timezone?.trim() || DEFAULT_TIMEZONE],
  );

  return mapUser(result.rows[0]);
}
