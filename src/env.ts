import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  PORT: z.string().default('3000').transform(val => parseInt(val, 10)),
  SERVER_SECRET: z.string().min(32, 'SERVER_SECRET must be at least 32 characters'),
  DYNDNS_USERNAME: z.string().min(1, 'DYNDNS_USERNAME is required'),
  DYNDNS_TOKEN: z.string().min(1, 'DYNDNS_TOKEN is required'),
  HETZNER_API_TOKEN: z.string().min(1, 'HETZNER_API_TOKEN is required'),
  HETZNER_ZONE_ID: z.string().min(1, 'HETZNER_ZONE_ID is required'),
  HETZNER_ARECORD_NAME: z.string().min(1, 'HETZNER_ARECORD_NAME is required')
})

const parseEnv = () => {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Environment variable validation failed:')
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    })
    process.exit(1)
  }

  return result.data
}

const env = parseEnv()

export const config = {
  port: env.PORT,
  serverSecret: env.SERVER_SECRET,
  dyndnsUsername: env.DYNDNS_USERNAME,
  dyndnsToken: env.DYNDNS_TOKEN,
  hetznerApiToken: env.HETZNER_API_TOKEN,
  hetznerZoneId: env.HETZNER_ZONE_ID,
  hetznerARecordName: env.HETZNER_ARECORD_NAME
}
