# Survivor Dapp

The survivor dapp (better name to be conceived) is a decentralized app for playing in a survivor pool during the NCAA Men's March Madness basketball tournament.

## Motivation

Today, there are several ways to play in a survivor pool like through a private bookee, a casino, or a website/app. Although, this works for most people, the experience can be better. The experience can be anonymous, permissionless, transparent, and non-custodied by leveraging blockchain technology. Trusting a bookee, bowing to casino policies, region locking, predatory data collecting schemes, mismanagement, and corruption can all be addressed by running a survivor pool in a decentralized manner.

## Rules of a Survivor Pool

- Each wallet gets one `pool entry`
- Each `pool entry` chooses one team each day that games are played
- A `pool entry` can only choose a given team one time throughout the duration of the tournament
- If a `pool entry`'s pick is correct, they survive until the next day
- If a `pool entry`'s pick is incorrect, they are eliminated from the pool
- The goal is to be the last `pool entry` standing at the end of the tournament

## User Requirements

Since this is a large departure from how people traditionally interact with a survivor pool, it is worth noting the pre-requiresites of a user. A user would need to be crypto-savvy enough to custody their own wallet. They would also need to be able to bridge funds from the Ethereum network to the Polygon network. Once on the Polygon network, the user would need to own `MATIC` to pay for transaction fees and enough stablecoin (tbd) to be able to play in the survivor pool.

## Architecture

### Blockchain

The core layer is the Ethereum ecosystem, specificially the low-cost and fast side-chain, Polygon. A pool would be facilitated by a smart contract deployed on Polygon that handles new pool entries, pool picks, event results, and pool payouts.

### UI

Typically users would interact with the smart contract via the UI. In order to maximize decentraliztion, the UI would be written in React, bundled, uploaded to IPFS, and an ENS domain name would be set. The user would visit `some-app-name.eth` in a compatible browser. Users will also be able to visit the traditional domain name (`some-app-name.com`) via any browser.
