import fastify from "fastify";
import { sql } from "./src/connection/connection";
import z, { number, string } from "zod";
import { redis } from "./src/connection/redis";

const app = fastify();

app.get("/", (req, reply) => {
  return "Hello world!";
});

app.post("/order", async (req, reply) => {
  const schemaOrder = z.object({
    flavor: string().min(3),
    price: number(),
    quantity: number(),
    pizzatype: string(),
    pagamentmethod: string(),
  });

  const { flavor, price, quantity, pizzatype, pagamentmethod } =
    schemaOrder.parse(req.body);

  try {
    const formatName = `${flavor}`;

    const selectPizzas = await sql`
    select quantity from pizzas where flavor = ${formatName}
  `;

    if (selectPizzas.length === 0) {
      reply.status(400).send({
        message: "As pizzas para esse sabor acabaram...",
      });
    } else {
      const update = await sql`
    UPDATE pizzas
    SET quantity = quantity - ${quantity}
    WHERE flavor = ${formatName}
    `;
      if(update){
        const result = await sql`
        insert into orders (flavor, price, quantity, pizzatype, pagamentmethod) values (${flavor}, ${price}, ${quantity}, ${pizzatype}, ${pagamentmethod}) returning flavor, price, quantity, pizzatype, pagamentmethod
        `;
  
        const order = result[0];
  
        await redis.zIncrBy("analyseOrder", 1, String(order.flavor));
  
        return reply.status(200).send({
          message: "Pedido criado com sucesso",
          data: order,
        });
      }
    }
  } catch (err) {
    return reply.status(500).send({
      message: err,
    });
  }
});

app.get("/api/analyse", async (req, reply) => {
  const result = await redis.zRangeByScoreWithScores("analyseOrder", 0, 25);

  const analyse = result
    .sort((a, b) => b.score - a.score)
    .map((item) => {
      return {
        flavors: item.value,
        qtdFlavor: item.score,
      };
    });

  return analyse;
});

app.get("/api/orders", async (req, reply) => {
  try {
    const result = await sql`
      select * from orders
    `;

    return result;
  } catch (err) {
    reply.status(500).send({
      message: err,
    });
  }
});

app.get("/api/pizzas", async (req, reply) => {
  try {
    const result = await sql`
      select * from pizzas
    `;

    return result;
  } catch (err) {
    reply.status(500).send({
      message: "Internal server error",
    });
  }
});

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log(`listening on http://localhost:3333`);
  })
  .catch((err) => {
    console.log(err);
  });
