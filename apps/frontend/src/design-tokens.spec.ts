import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards the global design tokens in `styles.css` (single source of truth for
 * --accent / --danger / … used by both the admin BEM layer and the public
 * pages). A self-referential custom property such as `--danger: var(--danger)`
 * is a *guaranteed-invalid value* per the CSS spec: every `var(--danger)`
 * consumer silently falls back to its initial value (e.g. `background` →
 * `transparent`), which is how the admin delete-confirm button once rendered
 * white text on a transparent background — invisible. These tests fail fast if
 * such a token is ever reintroduced.
 */
describe('global design tokens (styles.css)', () => {
  const css = readFileSync(join(__dirname, 'styles.css'), 'utf8');

  it('defines no custom property as a direct self-reference', () => {
    // Matches e.g. `--danger: var(--danger)` — a property resolving to itself.
    const selfReferences = [...css.matchAll(/(--[\w-]+)\s*:\s*var\(\s*\1\b/g)].map(
      (m) => m[1]
    );

    expect(selfReferences).toEqual([]);
  });

  it('resolves the danger tokens to concrete colors', () => {
    for (const token of ['--danger', '--danger-fg']) {
      const match = css.match(new RegExp(`${token}\\s*:\\s*([^;]+);`));
      if (!match) throw new Error(`token ${token} not found in styles.css`);
      expect(match[1].trim()).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }
  });
});
