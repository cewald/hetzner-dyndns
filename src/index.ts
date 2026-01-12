import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { config } from './env.js'
import { compareTokens } from './crypto.js'

const app = new Hono()

const updateParamsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  token: z.string().min(1, 'Token is required'),
  ipAddress: z.string().refine(
    (val) => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(val) || /^(?:[a-fA-F0-9:]+:+)+[a-fA-F0-9]+$/.test(val),
    { message: 'Invalid IP address format' }
  )
})

app.get(
  '/update/:username/:token/:ipAddress',
  zValidator('param', updateParamsSchema),
  async (c) => {
    const { username, token, ipAddress } = c.req.valid('param')

    if (config.dyndnsUsername && username !== config.dyndnsUsername) {
      return c.json({
        success: false,
        message: 'Unauthorized'
      }, 401)
    }

    if (config.dyndnsToken && !compareTokens(token, config.dyndnsToken)) {
      return c.json({
        success: false,
        message: 'Unauthorized'
      }, 401)
    }

    try {
      const url = `https://api.hetzner.cloud/v1/zones/${config.hetznerZoneId}/rrsets/${config.hetznerARecordName}/A/actions/set_records`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.hetznerApiToken}`
        },
        body: JSON.stringify({
          records: [
            {
              value: ipAddress,
              comment: `DynDNS updated: ${new Date().toISOString()}`
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Hetzner API error:', response.status, errorData)
        return c.json({
          success: false,
          message: 'Failed to update DNS record',
          error: errorData
        }, 500)
      }

      await response.json()

      return c.json({
        success: true,
        message: 'DNS record updated successfully',
        data: {
          ipAddress,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Error updating DNS record:', error)
      return c.json({
        success: false,
        message: 'Failed to update DNS record'
      }, 500)
    }
  }
)

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

serve({
  fetch: app.fetch,
  port: config.port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
