import { Pool } from "postgres-pool";
import { PipelineUser } from "../../services/generic-issuance/pipelines/types";
import { GenericIssuanceUserRow } from "../models";
import { sqlQuery } from "../sqlQuery";

export interface IPipelineUserDB {
  loadUsers(): Promise<PipelineUser[]>;
  clearAllUsers(): Promise<void>;
  getUser(userID: string): Promise<PipelineUser | undefined>;
  getUserByEmail(email: string): Promise<PipelineUser | undefined>;
  setUser(user: PipelineUser): Promise<void>;
}

export class PipelineUserDB implements IPipelineUserDB {
  private db: Pool;

  public constructor(db: Pool) {
    this.db = db;
  }

  private dbRowToPipelineUser(row: GenericIssuanceUserRow): PipelineUser {
    return {
      id: row.id,
      email: row.email,
      isAdmin: row.is_admin
    };
  }

  public async loadUsers(): Promise<PipelineUser[]> {
    const result = await sqlQuery(
      this.db,
      "SELECT * FROM generic_issuance_users"
    );
    return result.rows.map(this.dbRowToPipelineUser);
  }

  public async clearAllUsers(): Promise<void> {
    await sqlQuery(this.db, "DELETE FROM generic_issuance_users");
  }

  public async getUser(userID: string): Promise<PipelineUser | undefined> {
    const result = await sqlQuery(
      this.db,
      "SELECT * FROM generic_issuance_users WHERE id = $1",
      [userID]
    );
    if (result.rowCount === 0) {
      return undefined;
    } else {
      return this.dbRowToPipelineUser(result.rows[0]);
    }
  }

  public async getUserByEmail(
    email: string
  ): Promise<PipelineUser | undefined> {
    const result = await sqlQuery(
      this.db,
      "SELECT * FROM generic_issuance_users WHERE email = $1",
      [email]
    );
    if (result.rowCount === 0) {
      return undefined;
    } else {
      return this.dbRowToPipelineUser(result.rows[0]);
    }
  }

  public async setUser(user: PipelineUser): Promise<void> {
    await sqlQuery(
      this.db,
      `
    INSERT INTO generic_issuance_users (id, email, is_admin) VALUES($1, $2, $3)
    ON CONFLICT(id) DO UPDATE
    SET (email, is_admin) = ($2, $3)
    `,
      [user.id, user.email, user.isAdmin]
    );
  }
}