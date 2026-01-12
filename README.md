# Hetzner DynDNS Server

A tiny dynamic DNS server built with [Hono](https://hono.dev/) that automatically updates [Hetzner DNS](https://www.hetzner.com/dns/) A records when your IP address changes.

– *I need a small webserver to update the IP in my Hetzner DNS zone using [their API](https://docs.hetzner.cloud/reference/cloud#zone-rrset-actions-set-records-of-an-rrset) so my local network could be available over a specific domain if necessary. This little server runs inside of the VPC of my homelab and updates everything from inside-out.*

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

**Production (Node.js):**
```bash
npm run build
npm start
```

**Production (Docker):**
```bash
docker run -d \
  --name dyndns \
  -p 3000:3000 \
  -e SERVER_SECRET="your-secret" \
  -e DYNDNS_USERNAME="your-username" \
  -e DYNDNS_TOKEN="your-hashed-token" \
  -e HETZNER_API_TOKEN="your-hetzner-token" \
  -e HETZNER_ZONE_ID="your-zone-id" \
  -e HETZNER_ARECORD_NAME="your-arecord-name" \
  ghcr.io/YOUR_USERNAME/dyndns:latest
```

See [Docker Deployment](#docker-deployment) for more details.

## API Endpoints

### Health Check

Check if the server is running and healthy.

**Endpoint:**
```
GET /health
```

**Example:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T10:30:00.000Z",
  "uptime": 123.456
}
```

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

## Docker Deployment

This project includes a multi-stage Dockerfile based on Alpine Linux for minimal image size.

### Building Locally

```bash
docker build -t dyndns:latest .
```

To use a specific Node.js version:
```bash
docker build --build-arg NODE_VERSION=24 -t dyndns:latest .
```

### Running with Docker

**Using environment variables:**
```bash
docker run -d \
  --name dyndns \
  --restart unless-stopped \
  -p 3000:3000 \
  -e PORT=3000 \
  -e SERVER_SECRET="your-server-secret" \
  -e DYNDNS_USERNAME="your-username" \
  -e DYNDNS_TOKEN="your-hashed-token" \
  -e HETZNER_API_TOKEN="your-hetzner-token" \
  -e HETZNER_ZONE_ID="your-zone-id" \
  -e HETZNER_ARECORD_NAME="your-arecord-name" \
  dyndns:latest
```

To use a different port (e.g., 8080):
```bash
docker run -d \
  --name dyndns \
  --restart unless-stopped \
  -p 8080:8080 \
  -e PORT=8080 \
  -e SERVER_SECRET="your-server-secret" \
  -e DYNDNS_USERNAME="your-username" \
  -e DYNDNS_TOKEN="your-hashed-token" \
  -e HETZNER_API_TOKEN="your-hetzner-token" \
  -e HETZNER_ZONE_ID="your-zone-id" \
  -e HETZNER_ARECORD_NAME="your-arecord-name" \
  dyndns:latest
```

**Using .env file:**
```bash
docker run -d \
  --name dyndns \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  dyndns:latest
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  dyndns:
    image: ghcr.io/YOUR_USERNAME/dyndns:latest
    container_name: dyndns
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=${PORT:-3000}
      - SERVER_SECRET=${SERVER_SECRET}
      - DYNDNS_USERNAME=${DYNDNS_USERNAME}
      - DYNDNS_TOKEN=${DYNDNS_TOKEN}
      - HETZNER_API_TOKEN=${HETZNER_API_TOKEN}
      - HETZNER_ZONE_ID=${HETZNER_ZONE_ID}
      - HETZNER_ARECORD_NAME=${HETZNER_ARECORD_NAME}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Run with:
```bash
docker-compose up -d
```

### GitHub Container Registry

Images are automatically built and published to GitHub Container Registry when you push to the `main` branch or create a tag.

**Pull the image:**
```bash
docker pull ghcr.io/YOUR_USERNAME/dyndns:latest
```

**Available tags:**
- `latest` - Latest commit on main branch
- `main` - Latest commit on main branch
- `v1.0.0` - Specific version tags
- `sha-abc123` - Specific commit SHA

### Image Features

- ✅ **Alpine Linux** - Minimal base image (~50MB)
- ✅ **Multi-stage build** - Optimized for size
- ✅ **Non-root user** - Runs as `nodejs` user (UID 1001)
- ✅ **Health checks** - Built-in health monitoring
- ✅ **Multi-arch** - Supports AMD64 and ARM64
- ✅ **Signal handling** - Proper shutdown with dumb-init

