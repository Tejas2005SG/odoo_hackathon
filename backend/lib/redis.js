import { Redis } from '@upstash/redis'
import dotenv from "dotenv";

dotenv.config();


export const redis = new Redis({
  url: 'https://tender-rodent-11495.upstash.io',
  token: 'ASznAAIjcDFkOTg5OTliMzZiMmM0ZWFjODhiZDA5ODBlMjhjZjJmNHAxMA',
})

