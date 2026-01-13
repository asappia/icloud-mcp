# iCloud MCP Server

This MCP server provides Claude with access to iCloud services via standard protocols.

## Services Available

- **Email** - IMAP/SMTP (imap.mail.me.com / smtp.mail.me.com)
- **Calendar** - CalDAV (caldav.icloud.com)
- **Contacts** - CardDAV (contacts.icloud.com)

## Development Commands

- `npm install` - Install dependencies
- `npm start` - Start the MCP server
- `npm run inspect` - Test with MCP Inspector

## Authentication Setup

This server requires an **app-specific password** from Apple:

1. Go to https://appleid.apple.com
2. Sign in → Security → App-Specific Passwords
3. Generate a new password named "iCloud MCP"
4. Copy the 16-character password to `.env`

```env
ICLOUD_EMAIL=your-email@icloud.com
ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

## Architecture

```
icloud-mcp/
├── index.js              # Main MCP server
├── config.js             # Configuration
├── auth/                 # Credential management
├── email/                # IMAP/SMTP module
│   ├── imap-client.js    # IMAP connection
│   ├── smtp-client.js    # SMTP for sending
│   └── index.js          # Tool exports
├── calendar/             # CalDAV module
│   ├── caldav-client.js  # CalDAV connection (tsdav)
│   └── index.js          # Tool exports
├── contacts/             # CardDAV module
│   ├── carddav-client.js # CardDAV connection (tsdav)
│   └── index.js          # Tool exports
└── utils/                # Shared utilities
```

## Tools (17 total)

**Auth (2)**: about, check-auth-status

**Email (6)**: list-emails, read-email, send-email, search-emails, mark-as-read, list-folders

**Calendar (4)**: list-events, create-event, delete-event, list-calendars

**Contacts (5)**: list-contacts, search-contacts, read-contact, create-contact, delete-contact

## Key Differences from Outlook MCP

| Aspect | Outlook MCP | iCloud MCP |
|--------|-------------|------------|
| Auth | OAuth 2.0 (browser) | App-specific password |
| Email | Graph API REST | IMAP protocol |
| Calendar | Graph API REST | CalDAV |
| Contacts | Graph API REST | CardDAV |

## Limitations

- **No Reminders** - iOS 13+ format requires internal API
- **No Notes** - Requires internal API
- **No iCloud Drive** - Requires CloudKit setup
- **No Find My** - Internal API only

## Troubleshooting

- **Auth failed**: Verify app-specific password (not your Apple ID password)
- **IMAP error**: Check email format is correct
- **CalDAV/CardDAV timeout**: iCloud servers can be slow, retry
