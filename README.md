# Leave Me Alone! PoC

This is a proof of concept for bulk unsubscribing from a given set of organizations and repositories.

## Installation

Currently this is only usable from source, so you'll need to clone this repository and run `yarn` to install the dependencies it requires:

```shellsession
$ yarn
```

## Usage

To preview the current notifications:

```sh
$ GITHUB_ACCESS_TOKEN=[token]
yarn forget-me [orgs or owner/repo aliases]
```

To unsubscribe from these organizations

```
$ GITHUB_ACCESS_TOKEN=[token]
yarn forget-me --unsubscribe [orgs or owner/repo aliases]
```

When configuring the personal access token ensure it has access to the `notifications` scope, otherwise the script will error.

**No guarantees are provided for this tool. Use at your own risk.**

### What It's Doing

The GitHub API provides details about your current notifications, and these are persisted even after you remove yourself as the member of an organization.

This tool lets you see what notifications you have associated with a given set of organizations or repositories, and will unsubscribe if you pass in the `--unsubscribe` flag.

#### Examples

**Searching for notifications on a specific repository**

```sh
$ GITHUB_ACCESS_TOKEN=[token]
yarn forget-me atom/atom
yarn run v1.7.0
$ ts-node script/forget-me.ts atom/atom
Note: You have 684 pages of notifications but this script will be limited to the first 100 pages. This might take a while to crunch the data.

 - notification 349024187 from repo atom/atom with reason: subscribed
 - subject: 'Atom 1.28 crashes on macOS with Shadowsocks proxy'

✨  Done in 57.70s.
```

**Searching for notifications on a specific organization**

```sh
$ GITHUB_ACCESS_TOKEN=[token] 
yarn forget-me atom
yarn run v1.7.0
$ ts-node script/forget-me.ts atom
Note: You have 684 pages of notifications but this script will be limited to the first 100 pages. This might take a while to crunch the data.

 - notification 352634327 from repo atom/metrics with reason: subscribed
 - subject: 'Add metric to help assess awareness of key binding customizability'

 - notification 349024187 from repo atom/atom with reason: subscribed
 - subject: 'Atom 1.28 crashes on macOS with Shadowsocks proxy'

 - notification 287987267 from repo atom/ide-php with reason: subscribed
 - subject: 'IDE-PHP language server stopped unexpectedly. Without any description (Blank)'

✨  Done in 50.55s.
```

**Unsubscribing from notifications on a specific organization**

```sh
$ GITHUB_ACCESS_TOKEN=[token] 
yarn forget-me atom --unsubscribe
yarn run v1.7.0
$ ts-node script/forget-me.ts atom --unsubscribe
Note: Unsubscribing from all notification threads that match the provided organizations

Note: You have 652 pages of notifications but this script will be limited to the first 100 pages

 - unsubscribed from notification 352634327 from repo atom/metrics
 - unsubscribed from notification 349024187 from repo atom/atom
 - unsubscribed from notification 287987267 from repo atom/ide-php
✨  Done in 54.70s.
```
