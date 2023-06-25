#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import * as readlineModule from 'node:readline';

import { getCmd, getCommits, getCommitTypes, getVersionFlags } from './helpers';

export const readline = readlineModule.createInterface({
  input: process.stdin,
  output: process.stdout,
});

interface Settings {
  allowedBranch?: string;
  message?: string;
}

function getCommitTypesOrNull(commits: string[]): Map<string, number> | null {
  try {
    return getCommitTypes(commits);
  } catch (e) {
    console.log('❌ Could not parse all commits.');
    console.log(e);
    return null;
  }
}

function main(): void {
  const { version: currentVersion, microrelease: packageSettings } = JSON.parse(
    readFileSync('package.json').toString('utf8'),
  ) as {
    version: string;
    microrelease?: Settings;
  };

  const lastArgument = process.argv.at(-1);
  const prerelease = lastArgument && ['alpha', 'beta', 'rc'].includes(lastArgument) ? lastArgument : undefined;

  const [currentMajorVersion] = currentVersion.split('.').map((p) => Number.parseInt(p, 10));

  const settings: Settings = Object.assign(
    {
      message: 'chore(package): bump version to %s',
    },
    packageSettings ?? {},
  );

  console.log(`🎫 package.json loaded, config:`);

  for (const [key, value] of Object.entries(settings)) {
    console.log(`   ${key}: ${value}`);
  }

  const branch = execSync(`git branch --show-current`).toString().trim();
  if (settings.allowedBranch && branch !== settings.allowedBranch) {
    console.log(`❌ Branch must be ${settings.allowedBranch}, current branch is ${branch}`);
    process.exit(1);
  }
  console.log(`🌳 Branch is ${branch}`);

  console.log(`👉 Current version: ${currentVersion}`);
  const tag = execSync(`git tag -l v${currentVersion}`).toString();
  if (!tag) {
    console.log(`❌ Tag "v${currentVersion}" for version not found`);
    process.exit(2);
  } else {
    console.log('✅ Tag found');
  }

  console.log(`🔍 Check commits v${currentVersion}..HEAD`);
  const commits = getCommits(`v${currentVersion}`, 'HEAD');
  const types = getCommitTypesOrNull(commits);

  if (!types) {
    process.exit(3);
  }

  if (!types.size) {
    console.log(`❌ No commits found`);
    process.exit(4);
  }

  if (prerelease) {
    console.log(`🐤 Creating a prerelease on track '${prerelease}'`);
  }

  const { bumpMinorVersion, bumpMajorVersion } = getVersionFlags(currentMajorVersion, types);

  const versionCommandParam = getCmd(bumpMajorVersion, bumpMinorVersion, prerelease);
  const versionCommand = `npm version -m "${settings.message}" ${versionCommandParam}`;

  readline.question(`❔ Will run "${versionCommand}"`, () => {
    console.log(`🍀 Running npm version. Good luck!`);
    const result = execSync(versionCommand).toString().trim().split('\n').at(-1);
    console.log(`🚀 New version: ${result}`);

    readline.close();
  });
}

main();
