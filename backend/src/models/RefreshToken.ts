import db from "../../database/data.js";

type RefreshToken = {
  token: string;
  usuario_id: number;
  expires_at: string;
};

type RefreshTokenDB = {
  id: number;
  token: string;
  usuario_id: number;
  expires_at: string;
};

export function createRefreshToken(data: RefreshToken) {
  const command = db.prepare(
    `INSERT INTO refresh_tokens (token, usuario_id, expires_at) VALUES (?, ?, ?)`,
  );

  return command.run(data.token, data.usuario_id, data.expires_at);
}

export function findRefreshToken(token: string) {
  const command = db.prepare(`SELECT * FROM refresh_tokens WHERE token = ?`);

  return command.get(token) as RefreshTokenDB | undefined;
}

export function removeRefreshToken(token: string) {
  const command = db.prepare(`
        DELETE FROM refresh_tokens WHERE token = ?
        `);

  return command.run(token);
}

export function rotateToken(oldToken: string, newToken: RefreshToken) {
  const transaction = db.transaction(() => {
    createRefreshToken(newToken);

    removeRefreshToken(oldToken);
  });

  return transaction();
}
