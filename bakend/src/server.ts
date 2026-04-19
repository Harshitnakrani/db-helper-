import express from 'express'
import type { Express } from 'express'
import cors from 'cors'
import { chatRouter } from './controllers/chat.controller.js'

const server: Express = express()

server.use(cors())
server.use(express.json())
server.use(express.urlencoded({ extended: true }))
server.get('/health', (_req, res) => res.json({ ok: true }))
server.use('/chat', chatRouter)

export { server }
