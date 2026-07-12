import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // ── Backend: Clean Architecture Schichten ──────────────────────────
            // Domain: kennt nichts außer sich selbst und shared-contracts
            { sourceTag: 'scope:domain',         onlyDependOnLibsWithTags: ['scope:domain', 'scope:shared'] },
            // Infrastructure: implementiert Domain-Interfaces, darf shared (PrismaService) nutzen
            { sourceTag: 'scope:infrastructure',  onlyDependOnLibsWithTags: ['scope:infrastructure', 'scope:domain', 'scope:shared'] },
            // Application: CQRS Handlers kennen nur Domain-Interfaces + shared (kein Infrastructure-Import)
            { sourceTag: 'scope:application',     onlyDependOnLibsWithTags: ['scope:application', 'scope:domain', 'scope:shared'] },
            // Adapters: Controller nutzen CommandBus/QueryBus; dürfen application + domain + shared importieren
            { sourceTag: 'scope:adapters',        onlyDependOnLibsWithTags: ['scope:adapters', 'scope:application', 'scope:domain', 'scope:shared'] },
            // Shared: Infrastruktur-Querschnitt (auth-infra, database) darf domain importieren (DIP)
            { sourceTag: 'scope:shared',          onlyDependOnLibsWithTags: ['scope:shared', 'scope:domain'] },
            // ── Frontend ───────────────────────────────────────────────────────
            // Feature-Components dürfen data-access + shared nutzen
            { sourceTag: 'scope:feature',         onlyDependOnLibsWithTags: ['scope:feature', 'scope:domain', 'scope:shared', 'scope:data-access'] },
            // Data-Access darf shared und domain nutzen
            { sourceTag: 'scope:data-access',     onlyDependOnLibsWithTags: ['scope:data-access', 'scope:domain', 'scope:shared'] },
            // ── Platform-Trennung ──────────────────────────────────────────────
            // Frontend darf nie Backend-Libraries importieren und umgekehrt
            { sourceTag: 'platform:frontend',     onlyDependOnLibsWithTags: ['platform:frontend', 'platform:universal'] },
            { sourceTag: 'platform:backend',      onlyDependOnLibsWithTags: ['platform:backend', 'platform:universal'] },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
