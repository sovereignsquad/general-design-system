# Security Policy

## Reporting a vulnerability

Do not report a security vulnerability in a public issue, pull request or discussion.

Report it privately through GitHub: on the repository's **Security** tab, choose **Report a vulnerability**. If that option is not shown, open an issue that says only that you have a security report, with no details, and a maintainer will arrange a private channel.

Include:

- the affected package (`@sovereignsquad/gds`, `gds-theme`, `gds-core`, `gds-admin`, `gds-a11y`, `gds-compliance` or `gds-eslint-config`, all under `@sovereignsquad/`) and version;
- what an attacker can do, and the steps or code that reproduce it;
- any fix or mitigation you know of.

## How fixes ship

A fix is released as a new version of the packages on npmjs.com, and the advisory is published once that version is available. Releases are listed in [CHANGELOG.md](CHANGELOG.md) and on the [release notes page](https://sovereignsquad.github.io/general-design-system/releases).

## Dependencies

Dependency advisories are tracked by `npm run audit:dependencies`, which runs in the release chain; see [DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md).
