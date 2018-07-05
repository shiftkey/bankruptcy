# Leave Me Alone! PoC

This is a proof of concept for bulk unsubscribing from a given set of organizations and repositories.

To preview the current notifications:

```sh
$ GITHUB_ACCESS_TOKEN=[token] yarn forget-me [orgs or owner/repo aliases]
```

To unsubscribe from these organizations

```
$ GITHUB_ACCESS_TOKEN=[token] yarn forget-me --unsubscribe [orgs or owner/repo aliases]
```

When configuring the personal access token ensure it has access to the `notifications` scope, otherwise the script will error.

**No guarantees are provided for this tool. Use at your own risk.**

### What It's Doing

The GitHub API provides details about your current notifications, and these are persisted even after you remove yourself as the member of an organization.

This tool lets you see what notifications you have associated with a given set of organizations or repositories, and will unsubscribe if you pass in the `--unsubscribe` flag.

Examples:

```sh
~/src/leave-me-alone/ GITHUB_ACCESS_TOKEN=[token] yarn forget-me atom/atom
yarn run v1.7.0
$ ts-node script/forget-me.ts atom/atom
You have 790 pages of notifications
This script will only look at the first 100 pages of notifications
 - notification 349024187 from repo atom/atom with reason: subscribed
 - subject: 'Atom 1.28 crashes on macOS with Shadowsocks proxy'

✨  Done in 57.70s.
```

```sh
~/src/leave-me-alone/ GITHUB_ACCESS_TOKEN=[token] yarn forget-me atom
yarn run v1.7.0
$ ts-node script/forget-me.ts atom/atom
You have 768 pages of notifications but this script will be limited to the first 100 pages

 - notification 349024187 from repo atom/atom with reason: subscribed
 - subject: 'Atom 1.28 crashes on macOS with Shadowsocks proxy'

 - notification 287987267 from repo atom/ide-php with reason: subscribed
 - subject: 'IDE-PHP language server stopped unexpectedly. Without any description (Blank)'

✨  Done in 57.70s.
```

```sh
~/src/leave-me-alone/ GITHUB_ACCESS_TOKEN=[token] yarn forget-me atom --unsubscribe
yarn run v1.7.0
$ ts-node script/forget-me.ts atom/atom
You have 768 pages of notifications but this script will be limited to the first 100 pages

 - notification 349024187 from repo atom/atom with reason: subscribed
 - subject: 'Atom 1.28 crashes on macOS with Shadowsocks proxy'

✨  Done in 57.70s.
```
