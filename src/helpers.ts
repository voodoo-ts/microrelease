import { parser, Node } from '@conventional-commits/parser';
import { execSync } from 'node:child_process';

export function getCmd(bumpMajorVersion: boolean, bumpMinorVersion: boolean, prerelease: string | undefined): string {
  if (prerelease) {
    return `--preid ${prerelease} prerelease`;
  }
  if (bumpMajorVersion) {
    return 'major';
  }
  if (bumpMinorVersion) {
    return 'minor';
  }
  return 'patch';
}

export function getVersionFlags(
  currentMajorVersion: number,
  types: Map<string, number>,
): { bumpMajorVersion: boolean; bumpMinorVersion: boolean } {
  const bumpMajorVersion = types.has('breaking') && currentMajorVersion > 0;
  const bumpMinorVersion = types.has('feat') || types.has('refactor');
  return { bumpMajorVersion, bumpMinorVersion };
}

export function getCommits(from: string, to: string): string[] {
  return execSync(`git log --oneline ${from}..${to}`)
    .toString()
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split(' ').slice(1).join(' '));
}

export function getCommitTypes(commits: string[]): Map<string, number> {
  const types = new Map<string, number>();

  for (const commit of commits) {
    if (commit.startsWith('Merge')) {
      console.log('  ', commit, 'skipped');
      continue;
    } else {
      console.log('  ', commit);
    }
    const message = parser(commit);

    const summary = message.children[0];
    if (summary.type !== 'summary') {
      throw new Error('Commit parse error (summary not found)');
    }

    const type = summary.children.find((m) => m.type === 'type');

    if (type?.type !== 'type') {
      throw new Error('Commit parse error (type not found)');
    }

    const hasBreakingChange = summary.children.find((m) => (m as Node).type === 'breaking-change');
    if (hasBreakingChange) {
      types.set('breaking', (types.get('breaking') ?? 0) + 1);
    }

    const value = type.value.toLocaleLowerCase();
    types.set(value, (types.get(value) ?? 0) + 1);
  }

  return types;
}
