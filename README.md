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

## Contributing

This project welcomes contributions! Feel free to:

- Report bugs or suggest features via GitHub issues
- Submit pull requests for improvements
- Create and share your own custom NIPs

## License

MIT License - see LICENSE file for details.