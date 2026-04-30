import { Hono } from 'hono'

export const routes = new Hono()

routes.get('/', (c) => c.json({ message: 'nonda API' }))
