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

**No guarantees are provided for this tool. Use at your own risk.**

### What It's Doing

The GitHub API provides details about your current notifications, and these are persisted even after you remove yourself as the member of an organization.

This tool lets you see what notifications you have associated with a given set of organizations or repositories, and will unsubscribe if you pass in the `--unsubscribe` flag.
