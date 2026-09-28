# Third-party licenses

## @gyng/ditherer-filters 0.6.0 (vendored)

`vendor/gyng-ditherer-filters-0.6.0.tgz` is built unmodified from
https://github.com/gyng/ditherer/tree/master/packages/ditherer-filters at commit
`fcf86f25dd9e109940fe5eb9b629b7086b3a438d` (`npm run build:lib && npm pack`). It is vendored
because the package is only published to GitHub Packages, which needs an auth token even for
public packages. The MIT license text ships inside the tarball (`package/LICENSE`).

To update: clone that repo, `npm ci && npm run build:lib`, `npm pack` in
`packages/ditherer-filters`, replace the tarball, bump the version in `package.json`.

## Other dependencies

- mediabunny: MPL-2.0 (used unmodified from npm)
- gifenc: MIT
- fflate: MIT
- lucide-react: ISC
