import { Middleware, Next, Req, Res } from '@tsed/common'
import { NextFunction, Request, Response, Router } from 'express'
import { ClassType } from './server-bootstrap'

export function createMiddleware(middleware: Router): ClassType {
  @Middleware()
  class GraphqlMiddleware {
    private middleware?: Router = middleware

    use(@Req() request: Request, @Res() response: Response, @Next() next: NextFunction) {
      return this.middleware?.(request, response, next)
    }
  }
  return GraphqlMiddleware
}
