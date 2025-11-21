import { Pool, types } from "pg";
types.setTypeParser(1082, (val) => val);
types.setTypeParser(1114, (val) => val);

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});
