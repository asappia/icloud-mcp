<p align="center">
  <img src="https://img.icons8.com/color/96/icloud.png" alt="iCloud Logo" width="80"/>
</p>

<h1 align="center">iCloud MCP Server</h1>

<p align="center">
  <strong>Connect Claude to your iCloud services via the Model Context Protocol</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#tools">Tools</a> •
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node Version"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/>
  <img src="https://img.shields.io/badge/MCP-compatible-purple" alt="MCP Compatible"/>
  <img src="https://img.shields.io/badge/iCloud-IMAP%20%7C%20CalDAV%20%7C%20CardDAV-lightgrey" alt="Protocols"/>
</p>

---

## Overview

This MCP server enables Claude to interact with your iCloud services using standard protocols:

| Service | Protocol | Endpoint |
|---------|----------|----------|
| **Email** | IMAP / SMTP | `imap.mail.me.com` / `smtp.mail.me.com` |
| **Calendar** | CalDAV | `caldav.icloud.com` |
| **Contacts** | CardDAV | `contacts.icloud.com` |

---

## Features

- **17 Tools** for complete iCloud management
- **Secure Authentication** via Apple app-specific passwords
- **Standard Protocols** - no proprietary APIs
- **Full Email Support** - read, send, search, organize
- **Calendar Management** - events, multiple calendars
- **Contact Sync** - full CRUD operations

---

## Installation

```bash
# Clone the repository
git clone https://github.com/MrGo2/icloud-mcp.git
cd icloud-mcp

# Install dependencies
npm install

# Configure credentials
cp .env.example .env
# Edit .env with your credentials
```

---

## Configuration

### 1. Generate an App-Specific Password

> **Important**: You need an app-specific password, not your Apple ID password.

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Navigate to **Security** → **App-Specific Passwords**
4. Click **Generate** and name it `iCloud MCP`
5. Copy the 16-character password

### 2. Configure Environment

Edit your `.env` file:

```env
ICLOUD_EMAIL=your-email@icloud.com
ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### 3. Add to Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "icloud": {
      "command": "node",
      "args": ["/path/to/icloud-mcp/index.js"]
    }
  }
}
```

---

## Tools

### Authentication (2)

| Tool | Description |
|------|-------------|
| `about` | Server information |
| `check-auth-status` | Verify credentials |

### Email (6)

| Tool | Description |
|------|-------------|
| `list-emails` | List emails from a folder |
| `read-email` | Read full email content |
| `send-email` | Compose and send email |
| `search-emails` | Search by criteria |
| `mark-as-read` | Mark read/unread |
| `list-folders` | List mail folders |

### Calendar (4)

| Tool | Description |
|------|-------------|
| `list-events` | List upcoming events |
| `create-event` | Create new event |
| `delete-event` | Delete an event |
| `list-calendars` | List all calendars |

### Contacts (5)

| Tool | Description |
|------|-------------|
| `list-contacts` | List contacts |
| `search-contacts` | Search by name/email |
| `read-contact` | Get contact details |
| `create-contact` | Create new contact |
| `delete-contact` | Delete a contact |

---

## Architecture

```
icloud-mcp/
├── index.js              # MCP server entry point
├── config.js             # Centralized configuration
├── auth/                 # Credential management
│   └── index.js
├── email/                # IMAP/SMTP module
│   ├── imap-client.js    # Email retrieval
│   ├── smtp-client.js    # Email sending
│   └── index.js          # Tool definitions
├── calendar/             # CalDAV module
│   ├── caldav-client.js  # Calendar operations
│   └── index.js          # Tool definitions
├── contacts/             # CardDAV module
│   ├── carddav-client.js # Contact operations
│   └── index.js          # Tool definitions
└── utils/                # Shared utilities
    ├── date-utils.js     # Date formatting
    └── error-handler.js  # Error handling
```

---

## Usage Examples

### List Recent Emails

```
"Show me my last 10 emails"
```

### Send an Email

```
"Send an email to john@example.com with subject 'Meeting Tomorrow'
and body 'Hi John, can we meet at 10am?'"
```

### Check Calendar

```
"What events do I have this week?"
```

### Find a Contact

```
"Find the contact info for Maria García"
```

---

## Limitations

| Feature | Status | Reason |
|---------|--------|--------|
| Reminders | ❌ | iOS 13+ format requires internal API |
| Notes | ❌ | Requires internal API |
| iCloud Drive | ❌ | Requires CloudKit setup |
| Find My | ❌ | Internal API only |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Authentication failed** | Verify you're using an app-specific password, not your Apple ID password |
| **IMAP connection error** | Check email format is correct (`@icloud.com` or `@me.com`) |
| **CalDAV/CardDAV timeout** | iCloud servers can be slow - retry the operation |
| **No calendars found** | Ensure you have at least one calendar in iCloud |

---

## Development

```bash
# Run the server
npm start

# Test with MCP Inspector
npm run inspect

# Enable test mode (mock data)
npm run test-mode
```

---

## License

MIT © [Carlos Lorenzo](https://github.com/MrGo2)

---

<p align="center">
  <sub>Built for use with <a href="https://claude.ai">Claude</a> and the <a href="https://modelcontextprotocol.io">Model Context Protocol</a></sub>
</p>
