import { getPool } from "../db/pool.js";

function mapCredentials(row) {
  if (!row) return null;

  return {
    userId: row.user_id,
    provider: row.provider,
    refreshToken: row.refresh_token,
    accessToken: row.access_token,
    expiresAt: row.expires_at,
    scope: row.scope,
    updatedAt: row.updated_at,
  };
}

export async function getCredentials(userId, provider) {
  const result = await getPool().query(
    `
        SELECT *
        FROM user_credentials
        WHERE user_id = $1 AND provider = $2
        LIMIT 1
        `,
    [userId, provider],
  );

  return mapCredentials(result.rows[0]);
}

export async function upsertCredentials(input) {
  const result = await getPool().query(
    `
        INSERT INTO user_credentials
          (user_id, provider, refresh_token, access_token, expires_at, scope)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, provider)
        DO UPDATE SET
          refresh_token = COALESCE(EXCLUDED.refresh_token, user_credentials.refresh_token),
          access_token = COALESCE(EXCLUDED.access_token, user_credentials.access_token),
          expires_at = COALESCE(EXCLUDED.expires_at, user_credentials.expires_at),
          scope = COALESCE(EXCLUDED.scope, user_credentials.scope),
          updated_at = NOW()
        RETURNING *
        `,
    [
      input.userId,
      input.provider,
      input.refreshToken ?? null,
      input.accessToken ?? null,
      input.expiresAt ?? null,
      input.scope ?? null,
    ],
  );

  return mapCredentials(result.rows[0]);
}
