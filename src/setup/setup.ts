import { sql } from "../connection/connection";

async function setup() {
  await sql`
    create table if not exists orders(
      id      serial   primary key,
      flavor  text,
      price numeric,
      order_date timestamp default current_timestamp
    )
  `

  await sql.end()
}

setup()