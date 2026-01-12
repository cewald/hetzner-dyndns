# Hetzner DynDNS Server

A tiny dynamic DNS server built with [Hono](https://hono.dev/) that automatically updates [Hetzner DNS](https://www.hetzner.com/dns/) A records when your IP address changes.

I needed a small webserver to update the IP in my Hetzner DNS zone using their API so my local network could be available over a specific domain if necessary.
This little server runs inside of the VPC of my homelab and updates everything from inside-out.

## Features

- **Secure Authentication**: Token-based authentication with HMAC-SHA256 hashing
- **Timing Attack Protection**: Constant-time comparison prevents timing attacks
- **Environment Validation**: Zod-based validation ensures all required configuration is present
- **Token Generator**: Built-in script to generate secure tokens

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Generate Authentication Tokens

```bash
npm run generate-token
```

This will generate:
- A `SERVER_SECRET` (if not already set)
- A plain token for your DynDNS client
- A hashed token for your `.env` file

### 3. Configure Environment Variables

Copy the generated values to your `.env` file:

```env
PORT=3000
SERVER_SECRET=your-generated-server-secret
DYNDNS_USERNAME=your-username
DYNDNS_TOKEN=your-generated-hashed-token
HETZNER_API_TOKEN=your-hetzner-api-token
HETZNER_ZONE_ID=your-zone-id
HETZNER_ARECORD_NAME=your-subdomain
```

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Endpoints

### Update DNS Record

**REST Endpoint:**
```
GET /update/:username/:token/:ipAddress
```

**Example:**
```bash
curl http://localhost:3000/update/myuser/plain-token-here/192.168.1.1
```

### Response

**Success:**
```json
{
  "success": true,
  "message": "DNS update received",
  "data": {
    "ipAddress": "192.168.1.1"
  }
}
```

**Authentication Failure:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Validation Error:**
```json
{
  "success": false,
  "issues": [
    {
      "code": "invalid_string",
      "message": "Invalid IP address format",
      "path": ["ipAddress"]
    }
  ]
}
```

## Security Features

### Token Hashing
- Tokens are hashed using HMAC-SHA256 with a server secret
- Only hashed tokens are stored in environment variables

### Timing Attack Protection
- Uses `timingSafeEqual()` for constant-time token comparison
- Prevents attackers from learning token information through timing analysis

## Setup Hetzner DNS

To integrate with Hetzner DNS, you need:

1. **API Token**: Create a token in your Hetzner Cloud Console
   - Go to: https://console.hetzner.cloud/
   - Navigate to your project → Security → API Tokens
   - Create a new token with Read & Write permissions

2. **Zone ID**: Find your DNS zone ID
   - List your zones: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.hetzner.cloud/v1/zones`
   - Copy the zone ID from the response

3. **A Record Name**: The A record name you want to update (e.g., `dyndns`, `home`, `@` for root)

Add these to your `.env` file:
```env
HETZNER_API_TOKEN=your-token-here
HETZNER_ZONE_ID=your-zone-id-here
HETZNER_ARECORD_NAME=your-arecord-name-here
```

