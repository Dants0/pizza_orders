import fastify from "fastify";
import { sql } from "./src/connection/connection";
import z, { number, string } from "zod";

const app = fastify()

app.get("/", (req, reply) => {
  return "Hello world!"
})

app.post("/order", async (req, reply) => {

  const schemaOrder = z.object({
    flavor: string().min(3),
    price: number()
  })

  const { flavor, price } = schemaOrder.parse(req.body);

  try {

    const result = await sql`
    insert into orders (flavor, price) values (${flavor}, ${price}) returning id;
    `

    const order = result[0]

    if (order) {
      return reply.status(200).send({
        message: "Pedido criado com sucesso"
      })
    }

  } catch (err) {
    return reply.status(500).send({
      message: "Internal server error"
    })
  }
})

app.get("/api/orders", async(req, reply)=>{
  
  try{

    const result = await sql`
      select * from orders
    `

    return result

  }catch(err){

    reply.status(500).send({
      message: "Internal server error"
    })

  }

})

app.listen({
  port: 3333
}).then(() => {
  console.log(`listening on http://localhost:3333`)
}).catch((err) => {
  console.log(err)
})