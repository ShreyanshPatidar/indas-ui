// `npm publish` from a laptop put versions on npm that git never saw (0.1.7, 0.1.8). Publishing is
// the tag workflow's job (.github/workflows/publish-npm.yml), so anywhere else it stops here.
if (!process.env.GITHUB_ACTIONS) {
  console.error("indas-ui publishes from CI only. Bump the version, commit, then push a tag: git tag v<version> && git push origin main --tags")
  process.exit(1)
}
