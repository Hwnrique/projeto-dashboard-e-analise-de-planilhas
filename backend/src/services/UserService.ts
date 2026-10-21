import bcrypt from "bcrypt";
import db from "../../database/data.js";
import { findUserById, updateUserById } from "../models/User.js";

type UserChanges = {
  nome: string;
  login: string;
  senha: string;
};

type UpdateResult =
  | { tipo: "actor-inexistente" }
  | { tipo: "target-inexistente" }
  | { tipo: "proibido" }
  | { tipo: "atualizado" };

export default class UserService {
  static async updateUser(
    actorId: number,
    targetId: number,
    changes: UserChanges,
  ): Promise<UpdateResult> {
    const actor = findUserById(actorId);
    const target = findUserById(targetId);

    if (!actor) {
      return { tipo: "actor-inexistente" };
    }

    if (!target) {
      return { tipo: "target-inexistente" };
    }

    const allowed = actor.role === "admin" && (actor.id === target.id || target.role === "user");

    if (!allowed) {
      return { tipo: "proibido" };
    }

    const passwordHash = await bcrypt.hash(changes.senha, 10);

    return db.transaction((): UpdateResult => {
      const currentActor = findUserById(actorId);
      const currentTarget = findUserById(targetId);

      if (!currentActor) {
        return { tipo: "actor-inexistente" };
      }

      if (!currentTarget) {
        return { tipo: "target-inexistente" };
      }

      const stillAllowed =
        currentActor.role === "admin" &&
        (currentActor.id === currentTarget.id || currentTarget.role === "user");

      if (!stillAllowed) {
        return { tipo: "proibido" };
      }

      updateUserById(targetId, {
        nome: changes.nome,
        login: changes.login,
        senha: passwordHash,
      });

      return { tipo: "atualizado" };
    })();
  }
}
