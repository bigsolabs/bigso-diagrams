# elkjs 0.9.3 notices and source

The file `src/adapters/floorplan-canvas-elk.mjs` is the npm distribution's
`package/lib/elk.bundled.js` from [elkjs 0.9.3](https://registry.npmjs.org/elkjs/-/elkjs-0.9.3.tgz),
byte-for-byte, with `\nexport default globalThis.ELK;\n` appended to provide an
ES module export. Its upstream package declares EPL-2.0. The full license is
in `LICENSE-EPL-2.0.md`. Its bundled Google worker code carries a
`Copyright 2020 Google LLC` Apache-2.0 notice; the Apache license is in
`LICENSE-Apache-2.0.txt` (from https://www.apache.org/licenses/LICENSE-2.0.txt).
The original copyright and license headers remain in the bundled file.

The npm metadata identifies the source commit as
[a8304cf79fde75bc2ab1a89d28320f53f8637436](https://github.com/kieler/elkjs/tree/a8304cf79fde75bc2ab1a89d28320f53f8637436).
The upstream build also draws on the publicly available [Eclipse ELK](https://github.com/eclipse-elk/elk).
The [elkjs 0.9.3 release notes](https://github.com/kieler/elkjs/releases/tag/0.9.3)
identify ELK 0.9.1 as its base and also mention an additional upstream ELK fix.
ELK's `v0.9.1` tag resolves to `62d5909f96fad541bc101ad52dabaece6b7eab7e`,
and the additional fix was merged as `7ca51784e42a24201f29bc13e458728b6fc61cdc`.
The exact revision used for this npm build has not been established: upstream
CI at the elkjs commit checks out ELK `master`, not a pinned revision. Do not
infer a precise build revision or claim this establishes complete corresponding
source for the generated bundle.

The npm tarball and the recursive upstream elkjs tree at the pinned commit
contain no separate NOTICE file. This observation does not establish whether
all dependencies of the generated bundle have been inventoried.

Modified distribution and adapter source are in this repository at
`src/adapters/floorplan-canvas-elk.mjs` and `src/adapters/floorplan-canvas.mjs`.
Before distributing a standalone HTML file, ensure its recipients can obtain
all applicable corresponding source, including modifications, and that the
repository version containing these files is actually published or otherwise
provided. The project URL in the exported notice is not proof of publication.
