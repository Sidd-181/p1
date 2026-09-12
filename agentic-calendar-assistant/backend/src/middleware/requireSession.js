import { findUserById } from "../repositories/user.repository.js";
import { verifyAuthToken } from "../services/auth.service.js";

export async function requireSession(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized", success: false });
    return;
  }

  try {
    const claims = verifyAuthToken(token);
    const userId = String(claims.userId ?? "");

    if (!userId) {
      res.status(401).json({ error: "Unauthorized", success: false });
      return;
    }

    const user = await findUserById(userId);

    if (!user) {
      res.status(401).json({ error: "Unauthorized", success: false });
      return;
    }

    req.auth = {
      userId: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      token: claims,
    };

    next();
  } catch {
    res.status(401).json({ error: "session expired" });
  }
}
