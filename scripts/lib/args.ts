// args.ts — minimal shared CLI flag parsing for spec tooling scripts.
//
// Scripts with more than one flag parse through these helpers instead of
// ad-hoc `process.argv.includes`/`indexOf` scans. Boolean flags are detected
// by presence; value flags return the following argument (or null when absent).

export function parseFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

export function parseValueFlag(argv: string[], name: string): string | null {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("--")) return null;
  return value;
}

// Handle `--help`/`-h`: print usage to stdout and exit 0.
export function handleHelp(argv: string[], usage: string): boolean {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(usage);
    process.exit(0);
  }
  return false;
}

// Reject an unrecognized `-`-prefixed argument: diagnostic to stderr, exit 1.
export function rejectUnknown(argv: string[], known: Set<string>, usage = ""): void {
  for (const arg of argv) {
    if (arg.startsWith("-") && !known.has(arg)) {
      process.stderr.write(`unknown flag: ${arg}\n`);
      if (usage) process.stderr.write(usage);
      process.exit(1);
    }
  }
}
