import pino from 'pino'

const transport = pino.transport({
  targets: [
    { target: 'pino-loki', options: { batching: true }, level: 'error' },
    {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname'
      },
      level: 'info'
    }
  ],
  options: {
    level: 'info'
  }
})

const logger = pino(transport)

logger.error('This is third!')
