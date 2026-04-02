import { FastifyRequest, FastifyReply } from "fastify";

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true });
  } catch (err) {
    return reply.status(401).send({ error: "Sessão inválida ou não autorizada" });
  }
}
