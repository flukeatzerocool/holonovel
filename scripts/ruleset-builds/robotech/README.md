# Robotech ruleset build tooling

Committed build source for the `robotech` ruleset package (REQ-395a: build
tooling inside the git-tracked tree SHALL be committed). Migrated from the
content pipeline at `/home/fluke/Documents/Robotech-TTRPG/`.

- `extract-robotech.mjs` — Discovery extraction over the converted Markdown
  books; emits `extract-robotech.json` (index + model).
- `build-package.mjs` — assembles the six-file declarative package (REQ-389)
  from the extract and writes it to the install directory (REQ-420 fingerprint).

## Usage

```sh
# Extraction over the canonical converted sources:
node scripts/ruleset-builds/robotech/extract-robotech.mjs \
  --src /home/fluke/Documents/Robotech-TTRPG/converted \
  --out /home/fluke/Documents/Robotech-TTRPG/build

# Package build + install (auto-backup) into the deployed install dir:
node scripts/ruleset-builds/robotech/build-package.mjs \
  --extract /home/fluke/Documents/Robotech-TTRPG/build/extract-robotech.json \
  --install
```

`build-package.mjs` reads the package-format fingerprint and the host version
from the deployed host (`HOLONOVEL_DEPLOYED`, default
`/home/fluke/Holonovel-deployed`) and installs under
`TTRPG_RULESET_DIRS`/`<deployed>/.holonovel-state/rulesets`.
