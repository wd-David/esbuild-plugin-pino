const pino = require("pino")

const logger = pino(
  pino.transport({
    target: "pino-pretty",
  }),
)

logger.info("This is second!")
