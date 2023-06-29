import { Configuration, Inject, PlatformApplication } from '@tsed/common'
import { PlatformExpress } from '@tsed/platform-express'
import compress from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import methodOverride from 'method-override'
import SocketIO from 'socket.io'
import { sync } from 'fast-glob'

export interface ClassType<T = any> {
  new (...args: any[]): T
}

class Server {
  @Inject()
  public readonly app!: PlatformApplication

  @Configuration()
  public readonly settings!: Configuration
}

function createServer({
  controllers = [],
  port,
  apiRoot = '/',
  middleware = [],
  payloadSize = '100mb',
  socketIO,
  multer,
}: ServerConfiguration) {
  const controllerImplementations = controllers.flatMap(controller =>
    sync(controller).flatMap(file =>
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Object.values(require(file)),
    ),
  )
  // configure server
  Configuration({
    controllers,
    port,
    acceptMimes: ['application/json'],
    socketIO,
    logger: {
      ignoreUrlPatterns: ['/api/status'],
    },
    mount: {
      [apiRoot]: controllerImplementations,
    },
    multer,
    jsonMapper: {
      additionalProperties: false,
      disableUnsecureConstructor: true,
    },
    middlewares: [
      ...middleware,
      cookieParser(),
      compress({}),
      methodOverride(),
      express.json({ limit: payloadSize }),
      express.urlencoded({ extended: true }),
    ].filter(i => !!i),
  })(Server)

  return Server
}

export interface ServerConfiguration {
  controllers: string[]
  port: number
  apiRoot?: string
  middleware?: ClassType[] | any[]
  socketIO?: Partial<SocketIO.ServerOptions>
  multer?: Partial<TsED.MulterOptions>
  payloadSize?: string
}

export async function bootstrapServer({
  controllers,
  port,
  apiRoot,
  payloadSize,
  middleware,
  socketIO,
  multer,
}: ServerConfiguration) {
  try {
    const server = createServer({
      controllers,
      port,
      apiRoot,
      payloadSize,
      middleware,
      socketIO,
      multer,
    })
    const platform = await PlatformExpress.bootstrap(server)
    await platform.listen()
  } catch (er) {
    console.error(er)
  }
}
