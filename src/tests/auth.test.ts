import { socialAuthSchema } from '../schemas/auth.schema';
import { isProviderMatch } from '../utils/auth';

describe('socialAuthSchema', () => {
  it('accepts a valid payload', () => {
    const result = socialAuthSchema.safeParse({ idToken: 'token123', provider: 'google' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing idToken', () => {
    const result = socialAuthSchema.safeParse({ provider: 'google' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid provider', () => {
    const result = socialAuthSchema.safeParse({ idToken: 'token123', provider: 'facebook' });
    expect(result.success).toBe(false);
  });
});

describe('isProviderMatch', () => {
  it('matches google.com against claimed google provider', () => {
    expect(isProviderMatch('google.com', 'google')).toBe(true);
  });

  it('matches apple.com against claimed apple provider', () => {
    expect(isProviderMatch('apple.com', 'apple')).toBe(true);
  });

  it('rejects a mismatched provider', () => {
    expect(isProviderMatch('apple.com', 'google')).toBe(false);
  });

  it('rejects an undefined sign-in provider', () => {
    expect(isProviderMatch(undefined, 'google')).toBe(false);
  });
});
