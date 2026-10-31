// remote-url.ts — normalise git remote URLs so identity comparison ignores
// spelling (scheme, user, default port, `.git` suffix, trailing slash).
//
// `git remote get-url` returns whatever spelling the clone was created with:
// one repository is legitimately `git@host:org/repo.git` (scp form) or
// `ssh://git@host/org/repo.git` (URL form). Comparing those as raw strings
// rejected a real deploy (2026-10-31, REQ-418), so callers compare
// `sameRemote(a, b)` instead. Windows drive paths (`C:/repo`) are out of
// scope: they parse as a host plus path.

const DEFAULT_PORTS: Record<string, number> = {
  ssh: 22,
  "git+ssh": 22,
  https: 443,
  http: 80,
};

export function normalizeRemote(url: string): string {
  const raw = (url ?? "").trim();
  if (!raw) return "";

  let host = "";
  let path = raw;

  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(raw);
  if (scheme) {
    const name = scheme[1].toLowerCase();
    const rest = raw.slice(scheme[0].length);
    const slash = rest.indexOf("/");
    host = (slash === -1 ? rest : rest.slice(0, slash)).replace(/^[^@]*@/, "").toLowerCase();
    path = slash === -1 ? "" : rest.slice(slash + 1);
    const port = DEFAULT_PORTS[name];
    if (port && host.endsWith(`:${port}`)) host = host.slice(0, -String(port).length - 1);
  } else {
    // scp form: [user@]host:path — no "//" after the colon. A bare path (no
    // colon at all) falls through and is normalised as a local path.
    const scp = /^(?:[^@/]+@)?([^/:]+):(?!\/\/)(.+)$/.exec(raw);
    if (scp) {
      host = scp[1].toLowerCase();
      path = scp[2];
    }
  }

  path = path.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.git$/, "");
  return host ? `${host}/${path}` : path;
}

export function sameRemote(a: string, b: string): boolean {
  const left = normalizeRemote(a);
  const right = normalizeRemote(b);
  return left !== "" && left === right;
}
