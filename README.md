# NostrHub

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https://gitlab.com/soapbox-pub/nostrhub.git)

A website for viewing official Nostr Implementation Possibilities (NIPs) and publishing custom NIPs on the Nostr network.

🌐 **Live Site**: [https://nostrhub.io/](https://nostrhub.io/)

## Features

### Official NIPs
- Browse and search through official NIPs from the [nostr-protocol/nips](https://github.com/nostr-protocol/nips) repository
- View NIPs with proper markdown rendering and syntax highlighting
- Direct links to GitHub for each official NIP

### Custom NIPs
- Publish your own custom NIPs on the Nostr network using kind 30817 events
- Edit and update your published NIPs
- View recent custom NIPs from the community
- Support for NIP-19 naddr identifiers

### Features
- **Markdown Support**: Full markdown rendering with syntax highlighting for code blocks
- **Nostr Integration**: Built on the Nostr protocol for decentralized publishing
- **Responsive Design**: Works on desktop and mobile devices
- **Search**: Search through official NIPs by number or title
- **User Authentication**: Login with Nostr extensions (NIP-07) or other methods
- **App Directory**: Browse and submit Nostr applications with detailed information
- **Community Flagging**: Report suspicious apps using NIP-1984 reporting system

## URL Structure

- `/` - Home page with official NIPs and recent custom NIPs
- `/nip/01` - View official NIP-01
- `/nip/naddr1...` - View custom NIP by naddr (NIP-19 identifier)
- `/create` - Create a new custom NIP
- `/edit/naddr1...` - Edit an existing custom NIP (owner only)
- `/my-nips` - View your published NIPs

## Custom NIP Format

Custom NIPs are published as kind 30817 events with the following structure:

- `content`: The markdown content of the NIP
- `d` tag: Unique identifier for the NIP
- `title` tag: The title of the NIP
- `k` tags: Event kinds that this NIP defines or relates to (optional)

## Technology Stack

- **React 18** with TypeScript
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **Nostrify** for Nostr protocol integration
- **React Router** for routing
- **TanStack Query** for data fetching
- **React Markdown** for markdown rendering
- **Vite** for build tooling

## Environment Variables

The site can be customized by setting environment variables. Copy `.env.example` to `.env` and customize:

```bash
# Site Configuration
VITE_SITE_NAME=nostrhub.io      # Site name used for client tags and redirects
VITE_SITE_URL=https://nostrhub.io  # Full site URL
```

### Deployment Customization

When deploying your own instance, you can customize:

1. **Site Name**: Changes the client tag in published events and redirect targets
2. **Site URL**: Used for any absolute URLs that reference the site

Example for a custom deployment:

```bash
# .env
VITE_SITE_NAME=my-nostr-site.com
VITE_SITE_URL=https://my-nostr-site.com
```

## Development

```bash
# Install dependencies and start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Deploy
npm run deploy
```

### Development Environment Variables

For development, you can create `.env.local` to override settings locally without affecting the repository:

```bash
# .env.local (for development only)
VITE_SITE_NAME=localhost:8080
VITE_SITE_URL=http://localhost:8080
```

## App Flagging System

The app directory includes a community-driven content moderation system using NIP-1984 report events:

### Report Categories
- **fraud** - Fake information
- **spam** - Unwanted promotional content
- **scam** - Malicious/deceptive content
- **duplicate** - Duplicate entries
- **inappropriate** - Violates community standards
- **impersonation** - Fake identity/business

### How Flagging Works
1. **Signed-in users** can flag any app from the app detail page
2. **Flag reports** are published as kind 1984 events on Nostr
3. **Flag counts** are displayed prominently on app detail pages
4. **Severity indicators** show warning levels based on flag count
5. **One flag per user** prevents duplicate reports from the same person

### Flag Event Structure
```json
{
  "kind": 1984,
  "pubkey": "flagger_pubkey",
  "content": "This directory entry appears to be fraudulent - fake business information",
  "tags": [
    ["e", "target_event_id", "relay_url"],
    ["p", "target_author_pubkey"],
    ["report", "fraud"],
    ["l", "app-flag", "nostrhub.app.flags"],
    ["k", "31990"]
  ]
}
```

### Community Guidelines
- **Only flag apps that violate community standards**
- **Provide detailed descriptions** for your reports
- **False reports may result in account suspension**
- **Flag data is public** and visible to all users

## Contributing

This project welcomes contributions! Feel free to:

- Report bugs or suggest features via GitHub issues
- Submit pull requests for improvements
- Create and share your own custom NIPs

## License

MIT License - see LICENSE file for details.