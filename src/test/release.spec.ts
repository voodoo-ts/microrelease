import { getCmd, getCommitTypes } from '@/helpers';

describe('getCommitTypes', () => {
  it('should return the correct histogram', () => {
    const commitTypes = getCommitTypes(['feat: foo bar', 'fix: test', 'feat!: breaking']);
    expect(Object.fromEntries(commitTypes.entries())).toEqual({
      feat: 2,
      fix: 1,
      breaking: 1,
    });
  });

  it('should throw for invalid commits', () => {
    expect(() => getCommitTypes(['this is an invalid commit msg'])).toThrow();
  });
});

describe('getCmd()', () => {
  it('should bump major if only major should be bumped', () => {
    const result = getCmd(true, false, undefined);
    expect(result).toEqual('major');
  });
  it('should bump major version if both major and minor should be bumped', () => {
    const result = getCmd(true, true, undefined);
    expect(result).toEqual('major');
  });
  it('should bump minor version if only minor is set', () => {
    const result = getCmd(false, true, undefined);
    expect(result).toEqual('minor');
  });
  it('should bump patch if neither major nor minor are set', () => {
    const result = getCmd(false, false, undefined);
    expect(result).toEqual('patch');
  });
  it('should use prerelease track if set', () => {
    const result = getCmd(false, false, 'alpha');
    expect(result).toEqual('--preid alpha prerelease');
  });
});
