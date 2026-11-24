const babelConfig = require('../babel.config');

const ENV_KEYS = ['BABEL_ENV', 'NODE_ENV', 'E2E_BUILD', 'E2E_SKIP_ONBOARDING'];
let saved;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));
  ENV_KEYS.forEach(key => delete process.env[key]);
  process.env.BABEL_ENV = 'production';
});

afterEach(() => {
  ENV_KEYS.forEach(key => {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  });
});

function evaluate(env) {
  Object.assign(process.env, env);
  let cacheKey;
  const config = babelConfig({cache: {using: fn => (cacheKey = fn())}});
  const define = config.plugins.find(
    plugin => Array.isArray(plugin) && plugin[0] === 'transform-define',
  );
  return {cacheKey, defines: define && define[1]};
}

describe('Babel build flags', () => {
  it.each([
    [{}, false, false],
    [{E2E_BUILD: 'true'}, true, true],
    [{E2E_BUILD: 'true', E2E_SKIP_ONBOARDING: 'false'}, true, false],
    [{E2E_BUILD: '1'}, false, false],
  ])('bundling env %j defines E2E=%s and skip onboarding=%s', (env, isE2E, skip) => {
    expect(evaluate(env).defines).toEqual({
      __E2E__: isE2E,
      __E2E_SKIP_ONBOARDING__: skip,
    });
  });

  it('keeps E2E flags in the Babel cache key', () => {
    const normal = evaluate({}).cacheKey;
    const e2e = evaluate({E2E_BUILD: 'true'}).cacheKey;
    expect(e2e).not.toEqual(normal);
  });

  it('does not define build constants under Jest', () => {
    expect(evaluate({BABEL_ENV: 'test'}).defines).toBeUndefined();
  });
});
