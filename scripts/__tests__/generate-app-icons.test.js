const {execFileSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const GENERATOR_PATH = path.join(__dirname, '..', 'generate-app-icons.js');
const {
  APPICONSET,
  ANDROID_RES,
  SOURCE_DIR,
  SOURCE_FILES,
  generate,
  opaqueRgbPng,
  parseSvg,
  toVectorDrawable,
  buildTextOutputs,
} = require(GENERATOR_PATH);

const canvas = body =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 -28 168 168">${body}</svg>`;

const SQUARE = '<path id="square" d="M0 0H9V9Z" fill="#000000"/>';

const vd = body => toVectorDrawable(parseSvg(canvas(body)));

const visible = relative =>
  relative.split(path.sep).every(part => !part.startsWith('.'));

describe('parseSvg', () => {
  it.each([
    ['<rect width="1" height="1"/>', '<rect>'],
    [
      '<path d="M0 0H9" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="2"/>',
      'stroke-dasharray',
    ],
    [
      '<defs><linearGradient id="a"/></defs><path d="M0 0H9V9Z" fill="#000000"/>',
      '<linearGradient>',
    ],
    ['<use href="#a"/>', '<use>'],
    ['<g opacity="0.5">' + SQUARE + '</g>', 'opacity'],
    ['<path d="M0 0H9V9Z" fill="url(#g)"/>', 'fill="url(#g)"'],
    ['<path d="M0 0H9V9Z"/>', 'explicit fill'],
    ...['a<b', 'a&amp;b', "a'b", 'a b', '1a', ''].map(id => [
      `<path id="${id}" d="M0 0H9V9Z" fill="#000000"/>`,
      `unsupported id="${id}" on <path>`,
    ]),
    [
      `<defs><clipPath id="c&lt;"><path d="M0 0H9V9Z"/></clipPath></defs><g clip-path="url(#c)">${SQUARE}</g>`,
      'unsupported id="c&lt;" on <clipPath>',
    ],
    [`<g id="g>">${SQUARE}</g>`, 'unsupported id="g>" on <g>'],
    [
      `<defs><clipPath id="icon-mask"><path d="M0 0H9V9Z"/></clipPath></defs><g clip-path="url(#icon-mask)">${SQUARE}</g>`,
      'id icon-mask is reserved',
    ],
    [
      '<path id="icon-mask" d="M0 0H9V9Z" fill="#000000"/>',
      'id icon-mask is reserved',
    ],
  ])('rejects %s naming %s', (body, name) => {
    expect(() => parseSvg(canvas(body))).toThrow(name);
  });

  it('rejects a viewBox other than the canvas', () => {
    expect(() =>
      parseSvg(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112">${SQUARE}</svg>`,
      ),
    ).toThrow('viewBox');
  });

  it('rejects stray text and unclosed elements', () => {
    expect(() => parseSvg(canvas(`hello${SQUARE}`))).toThrow('hello');
    expect(() => parseSvg(canvas(`<g>${SQUARE}`))).toThrow();
  });
});

describe('toVectorDrawable', () => {
  it('maps the canvas onto a 108dp viewport shifted by the bleed', () => {
    const xml = vd(SQUARE);
    expect(xml).toContain('android:width="108dp"');
    expect(xml).toContain('android:viewportWidth="168"');
    expect(xml).toMatch(
      /<group\n\s+android:translateX="28"\n\s+android:translateY="28">/,
    );
  });

  it('maps path attributes by name and passes path data through', () => {
    const xml = vd(
      '<path id="p" d="M1 2C3 4 5 6 7 8Z" fill="#abcdef" fill-opacity="0.4" fill-rule="evenodd"/>' +
        '<path id="s" d="M0 0L9 9" fill="none" stroke="#343434" stroke-width="5.7931" stroke-linecap="round"/>',
    );
    expect(xml).toContain('android:name="p"');
    expect(xml).toContain('android:fillColor="#ABCDEF"');
    expect(xml).toContain('android:fillAlpha="0.4"');
    expect(xml).toContain('android:fillType="evenOdd"');
    expect(xml).toContain('android:pathData="M1 2C3 4 5 6 7 8Z"');
    expect(xml).toContain('android:strokeColor="#343434"');
    expect(xml).toContain('android:strokeWidth="5.7931"');
    expect(xml).toContain('android:strokeLineCap="round"');
    expect(xml.match(/fillColor/g)).toHaveLength(1);
  });

  it.each([
    [
      'rotate(-30 10 20)',
      ['android:rotation="-30"', 'android:pivotX="10"', 'android:pivotY="20"'],
    ],
    [
      'translate(1.5 -2)',
      ['android:translateX="1.5"', 'android:translateY="-2"'],
    ],
    ['scale(2)', ['android:scaleX="2"', 'android:scaleY="2"']],
  ])('maps transform %s onto one group', (transform, expected) => {
    const xml = vd(`<g id="t" transform="${transform}">${SQUARE}</g>`);
    const group = xml.slice(xml.indexOf('android:name="t"'));
    for (const attribute of expected) {
      expect(group).toContain(attribute);
    }
  });

  it.each([
    'translate(1 2) rotate(3)',
    'matrix(1 0 0 1 0 0)',
    'rotate(3)',
    'translate(1.2.3 4)',
    'scale(.)',
  ])('rejects transform %s naming it', transform => {
    expect(() =>
      parseSvg(canvas(`<g transform="${transform}">${SQUARE}</g>`)),
    ).toThrow(transform);
  });

  it('emits a referenced clipPath as the first child of its group', () => {
    const xml = vd(
      '<defs><clipPath id="c"><path d="M0 0H9V9Z"/></clipPath></defs>' +
        `<g id="clipped" clip-path="url(#c)">${SQUARE}</g>`,
    );
    expect(xml).toMatch(
      /android:name="clipped">\n\s+<clip-path\n\s+android:pathData="M0 0H9V9Z" \/>\n\s+<path/,
    );
  });

  it.each([
    [
      'an unreferenced clipPath',
      '<defs><clipPath id="c"><path d="M0 0H9V9Z"/></clipPath></defs>' + SQUARE,
      'never referenced',
    ],
    [
      'an inline clipPath',
      '<clipPath id="c"><path d="M0 0H9V9Z"/></clipPath>' +
        `<g clip-path="url(#c)">${SQUARE}</g>`,
      'must sit in <defs>',
    ],
    [
      'an unknown reference',
      `<g clip-path="url(#missing)">${SQUARE}</g>`,
      '#missing',
    ],
    [
      'a clip-path on a path',
      '<defs><clipPath id="c"><path d="M0 0H9V9Z"/></clipPath></defs>' +
        '<path d="M0 0H9V9Z" fill="#000000" clip-path="url(#c)"/>',
      'clip-path on <path>',
    ],
    [
      'a multi-child clipPath',
      '<defs><clipPath id="c"><path d="M0 0H9V9Z"/><path d="M0 0H1V1Z"/></clipPath></defs>' +
        `<g clip-path="url(#c)">${SQUARE}</g>`,
      'exactly one <path>',
    ],
  ])('rejects %s', (_, body, message) => {
    expect(() => parseSvg(canvas(body))).toThrow(message);
  });
});

describe('buildTextOutputs', () => {
  const sources = {
    foregroundLight: canvas(SQUARE),
    monochrome: canvas(
      '<path id="m" d="M0 0H9V9Z" fill="#FFFFFF" fill-rule="evenodd"/>',
    ),
  };

  it('writes the adaptive icon for both launcher names', () => {
    const outputs = buildTextOutputs(sources);
    const adaptive =
      outputs['android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'];
    expect(adaptive).toContain('@color/ic_launcher_background');
    expect(adaptive).toContain('@drawable/ic_launcher_foreground');
    expect(adaptive).toContain('@drawable/ic_launcher_monochrome');
    expect(
      outputs[
        'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml'
      ],
    ).toBe(adaptive);
    expect(
      outputs['android/app/src/main/res/values/ic_launcher_background.xml'],
    ).toContain('<color name="ic_launcher_background">#FFFFFF</color>');
  });

  it('writes Contents.json in Xcode single-size form', () => {
    const contents =
      buildTextOutputs(sources)[
        'ios/PocketPal/Images.xcassets/AppIcon.appiconset/Contents.json'
      ];
    expect(contents.endsWith('}\n')).toBe(true);
    expect(contents).toContain('"filename" : "AppIcon.png"');
    expect(contents).not.toMatch(/":/);
    const {images, info} = JSON.parse(contents);
    expect(info).toEqual({author: 'xcode', version: 1});
    expect(images.map(image => image.filename)).toEqual([
      'AppIcon.png',
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
    ]);
    expect(images.map(image => image.appearances?.[0].value)).toEqual([
      undefined,
      'dark',
      'tinted',
    ]);
    for (const image of images) {
      expect(image).toMatchObject({
        idiom: 'universal',
        platform: 'ios',
        size: '1024x1024',
      });
      expect(Object.keys(image)).toEqual([...Object.keys(image)].sort());
    }
  });
});

function pngHeader(buffer) {
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

describe('generate', () => {
  let root;

  const writeSources = overrides => {
    const files = {
      foregroundLight: canvas(SQUARE),
      foregroundDark: canvas(SQUARE),
      monochrome: canvas(
        '<path id="m" d="M0 0H9V9Z" fill="#FFFFFF" fill-rule="evenodd"/>',
      ),
      ...overrides,
    };
    for (const [key, text] of Object.entries(files)) {
      const target = path.join(root, SOURCE_DIR, SOURCE_FILES[key]);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, text);
    }
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-'));
  });

  afterEach(() => {
    fs.rmSync(root, {recursive: true, force: true});
  });

  it('writes nothing when a source carries an unsupported element', () => {
    writeSources({monochrome: canvas('<rect width="1" height="1"/>')});
    expect(() => generate({root})).toThrow('<rect>');
    expect(fs.existsSync(path.join(root, 'android'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'ios'))).toBe(false);
  });

  it('exits non-zero from the command line, naming the element', () => {
    writeSources({foregroundLight: canvas('<rect width="1" height="1"/>')});
    const script = path.join(root, 'scripts', 'generate-app-icons.js');
    fs.copyFileSync(GENERATOR_PATH, script);
    let failure;
    try {
      execFileSync('node', [script], {stdio: 'pipe'});
    } catch (error) {
      failure = error;
    }
    expect(failure.status).not.toBe(0);
    expect(failure.stderr.toString()).toContain('<rect>');
  });

  it.each(['previews', '..previews'])(
    'refuses the preview directory %s inside the repo',
    name => {
      writeSources();
      expect(() => generate({root, previewDir: path.join(root, name)})).toThrow(
        'outside the repo',
      );
    },
  );

  it('survives stray .DS_Store files, deleting the appiconset one', () => {
    writeSources();
    const strays = [`${APPICONSET}/.DS_Store`, `${ANDROID_RES}/.DS_Store`];
    for (const stray of strays) {
      fs.mkdirSync(path.dirname(path.join(root, stray)), {recursive: true});
      fs.writeFileSync(path.join(root, stray), 'finder');
    }

    generate({root});

    expect(fs.existsSync(path.join(root, strays[0]))).toBe(false);
    expect(fs.existsSync(path.join(root, strays[1]))).toBe(true);
  });

  it('replaces case-variant icons without deleting a written output', () => {
    writeSources();
    const dir = path.join(root, APPICONSET);
    fs.mkdirSync(dir, {recursive: true});
    for (const name of ['appicon.png', 'Appicon-Dark.png']) {
      fs.writeFileSync(path.join(dir, name), 'old');
    }
    const calls = spy =>
      spy.mock.calls.map(([file], i) => ({
        file: String(file).toLowerCase(),
        order: spy.mock.invocationCallOrder[i],
      }));
    const write = jest.spyOn(fs, 'writeFileSync');
    const remove = jest.spyOn(fs, 'rmSync');
    let writes;
    let removals;
    try {
      generate({root});
    } finally {
      writes = calls(write);
      removals = calls(remove);
      write.mockRestore();
      remove.mockRestore();
    }

    const removedAfterWrite = removals.filter(removal =>
      writes.some(
        ({file, order}) => file === removal.file && order < removal.order,
      ),
    );
    expect(removedAfterWrite).toEqual([]);
    expect(removals).toHaveLength(2);
    expect(fs.readdirSync(dir).sort()).toEqual([
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
      'AppIcon.png',
      'Contents.json',
    ]);
  });

  it('refuses a preview directory that reaches the repo through a symlink', () => {
    writeSources();
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-link-'));
    try {
      fs.symlinkSync(root, path.join(elsewhere, 'repo'), 'dir');
      for (const previewDir of [
        path.join(elsewhere, 'repo'),
        path.join(elsewhere, 'repo', 'previews'),
      ]) {
        expect(() => generate({root, previewDir})).toThrow('outside the repo');
      }
      expect(fs.existsSync(path.join(root, 'previews'))).toBe(false);
    } finally {
      fs.rmSync(elsewhere, {recursive: true, force: true});
    }
  });

  it('writes opaque iOS icons, exact legacy sizes and drops stale icons', () => {
    writeSources();
    const stale = path.join(root, APPICONSET, 'iPhone_App_60_2x.png');
    fs.mkdirSync(path.dirname(stale), {recursive: true});
    fs.writeFileSync(stale, 'stale');

    generate({root});

    expect(fs.readdirSync(path.join(root, APPICONSET)).sort()).toEqual([
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
      'AppIcon.png',
      'Contents.json',
    ]);
    for (const name of [
      'AppIcon.png',
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
    ]) {
      expect(
        pngHeader(fs.readFileSync(path.join(root, APPICONSET, name))),
      ).toEqual({width: 1024, height: 1024, colorType: 2});
    }
    const sizes = {mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192};
    for (const [density, size] of Object.entries(sizes)) {
      for (const name of ['ic_launcher', 'ic_launcher_round']) {
        const file = path.join(
          root,
          ANDROID_RES,
          `mipmap-${density}`,
          `${name}.png`,
        );
        expect(pngHeader(fs.readFileSync(file))).toMatchObject({
          width: size,
          height: size,
        });
      }
    }
  });
});

describe('opaqueRgbPng', () => {
  it('refuses a transparent pixel', () => {
    expect(() =>
      opaqueRgbPng(
        {width: 1, height: 1, pixels: Buffer.from([0, 0, 0, 0])},
        'x.png',
      ),
    ).toThrow('non-opaque pixel');
  });
});

describe('buildTextOutputs without the rasterizer', () => {
  afterEach(() => {
    jest.dontMock('@resvg/resvg-js');
  });

  it('never loads @resvg/resvg-js', () => {
    jest.doMock('@resvg/resvg-js', () => {
      throw new Error('resvg loaded');
    });
    jest.isolateModules(() => {
      const isolated = require(GENERATOR_PATH);
      expect(() =>
        isolated.buildTextOutputs({
          foregroundLight: canvas(SQUARE),
          monochrome: canvas(SQUARE),
        }),
      ).not.toThrow();
    });
  });
});

const SAFE_CENTER = 56;
const SAFE_RADIUS = 51.33;
const ARGUMENT_COUNTS = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

const MITER_LIMIT = 4;

function arcDiameter([x1, y1], [x2, y2], [rx, ry, rotation]) {
  const [a, b] = [Math.abs(rx), Math.abs(ry)];
  if (!a || !b) {
    return 0;
  }
  const angle = (rotation * Math.PI) / 180;
  const [dx, dy] = [(x1 - x2) / 2, (y1 - y2) / 2];
  const x = Math.cos(angle) * dx + Math.sin(angle) * dy;
  const y = Math.cos(angle) * dy - Math.sin(angle) * dx;
  const scaleUp = Math.sqrt(Math.max(1, (x / a) ** 2 + (y / b) ** 2));
  return 2 * Math.max(a, b) * scaleUp;
}

function pathExtremes(d) {
  const tokens = d.match(/[MLHVCSQTAZ]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi);
  const extremes = [];
  let current = [0, 0];
  let start = [0, 0];
  let lastControl = null;
  let command = null;
  let i = 0;
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) {
      command = tokens[i++];
    }
    const upper = command.toUpperCase();
    const relative = command !== upper;
    const args = tokens.slice(i, i + ARGUMENT_COUNTS[upper]).map(Number);
    i += ARGUMENT_COUNTS[upper];
    const point = (x, y) =>
      relative ? [current[0] + x, current[1] + y] : [x, y];
    const reflected = lastControl
      ? [2 * current[0] - lastControl[0], 2 * current[1] - lastControl[1]]
      : current;
    let end;
    let controls = [];
    let radius = 0;
    switch (upper) {
      case 'M':
      case 'L':
      case 'T':
        end = point(args[0], args[1]);
        controls = upper === 'T' ? [reflected] : [];
        break;
      case 'H':
        end = [relative ? current[0] + args[0] : args[0], current[1]];
        break;
      case 'V':
        end = [current[0], relative ? current[1] + args[0] : args[0]];
        break;
      case 'C':
        controls = [point(args[0], args[1]), point(args[2], args[3])];
        end = point(args[4], args[5]);
        break;
      case 'S':
        controls = [reflected, point(args[0], args[1])];
        end = point(args[2], args[3]);
        break;
      case 'Q':
        controls = [point(args[0], args[1])];
        end = point(args[2], args[3]);
        break;
      case 'A':
        end = point(args[5], args[6]);
        radius = arcDiameter(current, end, args);
        break;
      case 'Z':
        end = start;
        break;
    }
    lastControl = 'CSQT'.includes(upper) ? controls[controls.length - 1] : null;
    for (const control of controls) {
      extremes.push({point: control, radius: 0});
    }
    extremes.push({point: end, radius});
    if (upper === 'M') {
      start = end;
      command = relative ? 'l' : 'L';
    }
    current = end;
  }
  return extremes;
}

function applyTransform(transform, [x, y], radius) {
  const [a, b, c] = transform.values;
  if (transform.kind === 'translate') {
    return [[x + a, y + b], radius];
  }
  if (transform.kind === 'scale') {
    return [[x * a, y * a], radius * Math.abs(a)];
  }
  const angle = (a * Math.PI) / 180;
  const [dx, dy] = [x - b, y - c];
  return [
    [
      b + dx * Math.cos(angle) - dy * Math.sin(angle),
      c + dx * Math.sin(angle) + dy * Math.cos(angle),
    ],
    radius,
  ];
}

function palPointsOutsideSafeCircle(text) {
  const outside = [];
  const visit = (node, transforms, inPal) => {
    if (node.type === 'path') {
      if (!inPal) {
        return;
      }
      const strokeReach = node.attrs.stroke
        ? (Number(node.attrs['stroke-width']) * MITER_LIMIT) / 2
        : 0;
      for (const extreme of pathExtremes(node.attrs.d)) {
        let {point, radius} = extreme;
        radius += strokeReach;
        for (const transform of [...transforms].reverse()) {
          [point, radius] = applyTransform(transform, point, radius);
        }
        const distance =
          Math.hypot(point[0] - SAFE_CENTER, point[1] - SAFE_CENTER) + radius;
        if (distance > SAFE_RADIUS) {
          outside.push({id: node.attrs.id, point, distance});
        }
      }
      return;
    }
    const nested = node.transform
      ? [...transforms, node.transform]
      : transforms;
    for (const child of node.children) {
      visit(child, nested, inPal || node.id === 'pal');
    }
  };
  const tree = parseSvg(text);
  let palGroups = 0;
  const countPal = nodes => {
    for (const node of nodes) {
      if (node.type === 'group') {
        palGroups += node.id === 'pal' ? 1 : 0;
        countPal(node.children);
      }
    }
  };
  countPal(tree.children);
  expect(palGroups).toBe(1);
  for (const node of tree.children) {
    visit(node, [], false);
  }
  return outside;
}

const outsideIds = text => [
  ...new Set(palPointsOutsideSafeCircle(text).map(({id}) => id)),
];


const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REQUIRED_MARK_IDS = [
  'orbit-a',
  'orbit-b',
  'link-left',
  'link-right',
  'link-bottom',
  'node-left',
  'node-right',
  'node-bottom',
  'core',
];

const readCommittedSource = key =>
  fs.readFileSync(
    path.join(REPO_ROOT, SOURCE_DIR, SOURCE_FILES[key]),
    'utf-8',
  );

const pathGeometry = source =>
  [...source.matchAll(/<path id="([^"]+)" d="([^"]+)"/g)].map(
    ([, id, d]) => [id, d],
  );

describe('committed LocalMind neural-orbit icon sources', () => {
  it.each(Object.keys(SOURCE_FILES))('%s is valid SVG with the complete mark', key => {
    const source = readCommittedSource(key);
    expect(() => parseSvg(source)).not.toThrow();
    const ids = [...source.matchAll(/<path id="([^"]+)"/g)].map(
      ([, id]) => id,
    );
    expect(ids).toEqual(expect.arrayContaining(REQUIRED_MARK_IDS));
    expect(source).not.toMatch(/<text\b/i);
  });

  it('keeps identical mark geometry across light, dark and monochrome variants', () => {
    const light = readCommittedSource('foregroundLight');
    const dark = readCommittedSource('foregroundDark');
    const monochrome = readCommittedSource('monochrome');
    expect(pathGeometry(dark)).toEqual(pathGeometry(light));
    expect(pathGeometry(monochrome)).toEqual(pathGeometry(light));
  });

  it('uses a single opaque white color in the monochrome variant', () => {
    const source = readCommittedSource('monochrome');
    const colors = [...source.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map(
      ([, color]) => color,
    );
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.every(color => color === '#FFFFFF' || color === 'none')).toBe(
      true,
    );
  });

  it('keeps the dark foreground legible with bright orbit and node colors', () => {
    const source = readCommittedSource('foregroundDark');
    expect(source).toContain('stroke="#9D8BFF"');
    expect(source).toContain('stroke="#4DE0E8"');
    expect(source).toContain('fill="#FFFFFF"');
  });
});

describe('committed launcher outputs', () => {
  const outputs = [
    'android/app/src/main/res/drawable-nodpi/ic_launcher_foreground.png',
    'android/app/src/main/res/drawable-nodpi/ic_launcher_monochrome.png',
    'ios/PocketPal/Images.xcassets/AppIcon.appiconset/AppIcon.png',
    'ios/PocketPal/Images.xcassets/AppIcon.appiconset/AppIcon-dark.png',
    'ios/PocketPal/Images.xcassets/AppIcon.appiconset/AppIcon-tinted.png',
  ];

  it.each(outputs)('%s is generated and is a valid PNG', relative => {
    const file = path.join(REPO_ROOT, relative);
    expect(fs.existsSync(file)).toBe(true);
    const bytes = fs.readFileSync(file);
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  });

  it('keeps adaptive icon resources and legacy density icons present', () => {
    for (const relative of [
      'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
      'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
      'android/app/src/main/res/mipmap-mdpi/ic_launcher.png',
      'android/app/src/main/res/mipmap-hdpi/ic_launcher.png',
      'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png',
      'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
      'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
    ]) {
      expect(fs.existsSync(path.join(REPO_ROOT, relative))).toBe(true);
    }
  });
});
