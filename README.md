# Davy Jones

**UK** · Engineer [@zkp2p](https://github.com/zkp2p) · Founded [GalleonDAO](https://github.com/GalleonDAO) · [@davyjones0x](https://twitter.com/davyjones0x)

![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/-Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![Claude](https://img.shields.io/badge/-Claude-D97757?style=flat-square&logo=anthropic&logoColor=white)
![Hyperliquid](https://img.shields.io/badge/-Hyperliquid-84E29B?style=flat-square&logoColor=white)
![Base](https://img.shields.io/badge/-Base-0052FF?style=flat-square&logo=coinbase&logoColor=white)

---

### What I'm Building

**Autonomous Engineering Infrastructure**

I run a homeserver that ships code while I sleep. The stack:

- **Oneshot CLI** *(private)* - One command to ship code. Give it a repo and a task -- it plans (Claude), executes (Codex), reviews (Codex), and opens a PR. Runs over SSH to my server.
- **Oneshot Bot** *(private)* - Slack bot wired to Linear. Label a ticket `oneshot`, the bot enriches it with codebase context via Claude, dispatches it to the CLI, monitors progress via structured JSONL events, and posts the PR to Slack. Includes a swarm reviewer that runs 5 parallel review agents on every PR.
- **[Paperclip](https://paperclip.dev) Agents** - Autonomous AI teams running on heartbeat cycles that self-maintain my side projects. A "Dockyard" crew (Harbourmaster, Shipwright, Boatswain) triages issues, dispatches oneshot, and reviews PRs for [KnowFulham](https://knowfulham.com) and [Broadside](https://broadside.fun). A "Galleon Labs" crew runs the same loop for my P2P trading apps. They proactively create feature work, not just fix bugs.
- **[Barbossa](https://github.com/ADWilkinson/barbossa-dev)** - The earlier incarnation. Autonomous AI dev pipeline that turns GitHub backlog items into merged PRs.
- **[Claude Code Tools](https://github.com/ADWilkinson/claude-code-tools)** - Custom agents, skills, and commands for Claude Code.
- **[Peer Tools](https://github.com/ADWilkinson/peer-tools)** - Claude Code plugins for the ZKP2P P2P trading ecosystem.

The thesis: orchestrate AI agents with good taste and tight constraints, and they ship production code autonomously. The human role shifts from writing code to writing the systems that write code.

**ZKP2P Ecosystem** (day job)

- **[ZKP2P](https://zkp2p.xyz)** - P2P fiat onramp with ZK payment verification. Venmo, PayPal, Wise, Revolut, and more.
- **[Peerlytics](https://peerlytics.xyz)** - Liquidity intelligence dashboard. Volume-by-currency breakdowns, real-time events, intent explorer, cumulative PnL tracking.
- **[usdctofiat](https://usdctofiat.xyz)** - USDC off-ramp for makers on Base. Delegate system with an AI-powered arbitrage bot managing rates.
- **[Marauder](https://delegate.usdctofiat.xyz)** - Delegation landing page and dashboard with returns calculator.
- **[Network](https://network.peerlytics.xyz)** - Public P2P orderbook explorer with 3D visualization.

**Trading**

- **[Privateer](https://hlprivateer.xyz)** - Self-hosted agentic trading platform on Hyperliquid. Discretionary AI strategy with a strategist agent controlling long/short leg structure, deterministic risk gates, fail-closed SAFE_MODE with SL/TP enforcement, and an ASCII trade floor UI. Recently open-sourced.
- **[GalleonDAO](https://github.com/GalleonDAO)** - DeFi structured products. Raised $1M seed from 1kx, Angel DAO, MetaPortal.

**Side Projects**

- **[Broadside.fun](https://broadside.fun)** - Multiplayer browser naval combat. IO-style leveling, 4 ammo types, ability loadouts, king of the hill mode, CTF, day/night cycle, biomes, spatial audio. All self-hosted.
- **[KnowFulham](https://knowfulham.com)** - Opinionated local guide to Fulham. Interactive MapLibre map, handpicked places, community voting, crime heatmap layers. Self-hosted on PostgreSQL/PostGIS. Expanding to [Chelsea](https://knowchelsea.com) and [Notting Hill](https://knownottinghill.com).
- **[Flying Dutchman Theme](https://github.com/ADWilkinson/the-flying-dutchman-theme)** - VS Code theme.

---

### How It Works

Everything runs on a single homeserver (DAppNode). Docker Compose + Cloudflare Tunnels for the apps, systemd services for the AI agents. No cloud providers for personal projects.

```
Linear ticket labeled "oneshot"
        |
  Oneshot Bot enriches with codebase context (Claude)
        |
  Dispatches to Oneshot CLI on the server
        |
  Claude plans --> Codex executes --> Codex reviews --> PR opened
        |
  Swarm reviewer (5 agents) posts field report on GitHub
        |
  Paperclip Boatswain reviews and merges
```

Paperclip agents run on independent heartbeat cycles. The Harbourmaster reads the codebase, identifies improvements, creates issues, and assigns them to Shipwright, who dispatches oneshot. The loop is fully autonomous -- I review the PRs that land, not the work that generates them.

---

### Background

Founded **[GalleonDAO](https://github.com/GalleonDAO)** -- a DeFi structured products protocol. Raised $1M seed from 1kx, Angel DAO, and MetaPortal. Built and shipped on-chain products through the 2022 bear market.

Now at **ZKP2P** building trustless fiat rails. Buy and sell crypto P2P using Venmo, PayPal, Wise with ZK proofs verifying payments on-chain.

On the side, building the tooling I wish existed for running a one-person engineering org across 15+ repos.

---

### Philosophy

> Ship beats perfect.

Build tools that solve your own problems first. Small, composable pieces over monoliths. If an AI agent can ship it with good constraints, let it. Spend human attention on taste and architecture, not keystrokes.

---

### Connect

[![Twitter](https://img.shields.io/badge/-@davyjones0x-1DA1F2?style=flat-square&logo=twitter&logoColor=white)](https://twitter.com/davyjones0x)
[![Blog](https://img.shields.io/badge/-andrewwilkinson.xyz-000000?style=flat-square&logo=hashnode&logoColor=white)](https://andrewwilkinson.xyz)
[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/andrew-wilkinson-24894a102)
[![Email](https://img.shields.io/badge/-gm@galleonlabs.io-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:gm@galleonlabs.io)
