import { sql } from "../connection/connection";

async function deleteTable() {
  await sql`
  delete from orders
  `

  await sql.end()
}

deleteTable()