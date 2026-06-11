import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Database } from '../../src/types/index.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json')

let cache: Database | null = null
let cacheTime = 0
const CACHE_TTL = 100

export function readDB(): Database {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL) {
    return JSON.parse(JSON.stringify(cache))
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  cache = JSON.parse(raw) as Database
  cacheTime = now
  return JSON.parse(JSON.stringify(cache))
}

export function writeDB(data: Database): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  cache = data
  cacheTime = Date.now()
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
