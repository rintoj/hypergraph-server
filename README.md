# hypergraph-server

## Install

Using npm:

```sh
npm install hypergraph-server
```

Using yarn:

```sh
yarn add hypergraph-server
```

## Usage

Setup a service

```sh
mkdir my-service
cd my-service
yarn init -y
```

Setup `src/index.ts`

```ts
import 'reflect-metadata'

import { initializeGraphqlServer } from 'hypergraph-graphql'
import { bootstrapServer, createMiddleware } from 'hypergraph-server'
import { createSchema } from './schema'

async function run() {
  await bootstrapServer({
    port: 4000,
    apiRoot: '/api',
    controllers: [`${__dirname}/**/*-controller.ts`],
  })
}

void run()
```

Add controller

```ts
import { Controller, Get } from 'hypergraph-server'

@Controller('/user')
export class UserController {
  @Get('/me')
  async findCurrentUser() {
    return { user: null } // your logic
  }
}
```

Start the service

```bash
npx ts-node src/index.ts
```

This will expose a GET url [http://localhost:4000/api/user/me](http://localhost:4000/api/user/me)

```bash
[2023-06-29T16:43:35.723] [INFO ] [TSED] - Injector created... +3ms
[2023-06-29T16:43:35.723] [INFO ] [TSED] - Build providers +0ms
[2023-06-29T16:43:35.734] [INFO ] [TSED] - Settings and injector loaded... +11ms
[2023-06-29T16:43:35.736] [INFO ] [TSED] - Load routes +2ms
[2023-06-29T16:43:35.736] [INFO ] [TSED] - Routes mounted... +0ms
[2023-06-29T16:43:35.737] [INFO ] [TSED] -
┌───────────────┬──────────────┬──────────────────────────────────┐
│ Method        │ Endpoint     │ Class method                     │
│───────────────│──────────────│──────────────────────────────────│
│ GET           │ /api/user/me │ UserController.findCurrentUser() │
└───────────────┴──────────────┴──────────────────────────────────┘
[2023-06-29T16:43:35.738] [INFO ] [TSED] - Listen server on http://0.0.0.0:4001
[2023-06-29T16:43:35.738] [INFO ] [TSED] - Started in 18 ms +2ms
```

## Adding GraphQL

Create `src/schema.ts`

```ts
import { createGraphqlSchema, referenceResolver } from 'hypergraph-graphql'

export async function createSchema() {
  return await createGraphqlSchema({
    resolvers: [`${__dirname}/**/*-resolver.ts`],
    referenceResolvers: {
      // User: referenceResolver(UserRepository),
    },
    authChecker: () => true,
  })
}
```

Modify `src/index.ts`

```ts
async function run() {
  const schema = await createSchema()
  const router = initializeGraphqlServer({ schema })
  await bootstrapServer({
    port: 4000,
    apiRoot: '/api',
    controllers: [`${__dirname}/**/*-controller.ts`],
    middlewares: [createMiddleware(router)],
  })
}
```

Create a user schema by adding `src/schema/user/user-schema.ts`

```ts
import { Field, ObjectType } from 'type-graphql'
import { Repository } from 'hypergraph-storage'

@ObjectType()
export class User {
  @Field()
  id!: string

  @Field()
  name?: string
}
```

Add resolver `src/resolver/user/user-resolver.ts`

```ts
import { Query, Resolver } from 'type-graphql'
import { User } from '../../schema/user/user'

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  me() {
    return null
  }
}
```

Now start the service. This will expose a new endpoint
[http://localhost:4000/graphql](http://localhost:4000/graphql)
