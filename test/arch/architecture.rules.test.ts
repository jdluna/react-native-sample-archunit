// tests/arch/architecture.rules.test.ts
//
// ArchUnit rules that enforce the layered architecture shown in the diagram:
//
//   Contracts layer  <──  Presentation layer (ViewModels, Screens)
//        ↑                Domain layer (UseCases, Repository interfaces)
//        └──────────────  Data layer (Repositories impl, DataSources)
//
//   DI Container is the ONLY file allowed to import from all layers.
//   Layers consume contracts → DI / Service Locator injects implementations.
//
// Uses the `archunit` package (ArchUnitTS on npm). `archunit-ts` is not published.
// https://www.npmjs.com/package/archunit

import { projectFiles } from 'archunit';

const tsconfigPath = `${process.cwd()}/tsconfig.json`;
/** Empty layers in this sample repo would otherwise yield EmptyTestViolation. */
const archOpts = { allowEmptyTests: true };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const base = () => projectFiles(tsconfigPath);
const src = base();
const contractsLayer = base().inPath('src/contracts');
const domainLayer = base().inPath('src/domain');
const dataLayer = base().inPath('src/data');
const presentationLayer = base().inPath('src/presentation');
const diContainer = base().inPath('src/di');
/** Project sources under `src/` except the DI composition root */
const srcOutsideDi = base().inPath(/^src\/(?!di\/)/);

// ---------------------------------------------------------------------------
// RULE 1 — Contracts layer must be self-contained
//
//   The contracts layer defines interfaces for the host app and the SDK.
//   It must not import from any other layer (no circular deps, no leakage).
// ---------------------------------------------------------------------------
describe('Rule 1 — Contracts layer is self-contained', () => {
  test('contracts must not import from domain', async () => {
    await expect(
      contractsLayer.shouldNot().dependOnFiles().inPath('src/domain'),
    ).toPassAsync(archOpts);
  });

  test('contracts must not import from data', async () => {
    await expect(
      contractsLayer.shouldNot().dependOnFiles().inPath('src/data'),
    ).toPassAsync(archOpts);
  });

  test('contracts must not import from presentation', async () => {
    await expect(
      contractsLayer.shouldNot().dependOnFiles().inPath('src/presentation'),
    ).toPassAsync(archOpts);
  });

  test('contracts must not import from DI container', async () => {
    await expect(
      contractsLayer.shouldNot().dependOnFiles().inPath('src/di'),
    ).toPassAsync(archOpts);
  });
});

// ---------------------------------------------------------------------------
// RULE 2 — Domain layer only depends on contracts
//
//   UseCases and repository interfaces are pure business logic.
//   They may reference contract interfaces but must NOT know about
//   infrastructure (data sources, RN components, DI wiring).
// ---------------------------------------------------------------------------
describe('Rule 2 — Domain layer only depends on contracts', () => {
  test('domain must not import from data layer', async () => {
    await expect(
      domainLayer.shouldNot().dependOnFiles().inPath('src/data'),
    ).toPassAsync(archOpts);
  });

  test('domain must not import from presentation layer', async () => {
    await expect(
      domainLayer.shouldNot().dependOnFiles().inPath('src/presentation'),
    ).toPassAsync(archOpts);
  });

  test('domain must not import from DI container', async () => {
    await expect(
      domainLayer.shouldNot().dependOnFiles().inPath('src/di'),
    ).toPassAsync(archOpts);
  });

  test('domain use cases must live in src/domain/usecases', async () => {
    await expect(
      src.withName(/UseCase/).should().beInFolder('src/domain/usecases'),
    ).toPassAsync(archOpts);
  });

  test('domain repository interfaces must live in src/domain/repositories', async () => {
    await expect(
      src
        .withName(/IAnalyticsRepository|IEventQueueRepository/)
        .should()
        .beInFolder('src/domain/repositories'),
    ).toPassAsync(archOpts);
  });
});

// ---------------------------------------------------------------------------
// RULE 3 — Data layer only depends on domain interfaces + contracts
//
//   Concrete repository implementations and data sources are infrastructure.
//   They implement domain interfaces but must not bleed into presentation.
// ---------------------------------------------------------------------------
describe('Rule 3 — Data layer only depends on domain + contracts', () => {
  test('data must not import from presentation layer', async () => {
    await expect(
      dataLayer.shouldNot().dependOnFiles().inPath('src/presentation'),
    ).toPassAsync(archOpts);
  });

  test('data must not import from DI container', async () => {
    await expect(
      dataLayer.shouldNot().dependOnFiles().inPath('src/di'),
    ).toPassAsync(archOpts);
  });

  test('repository implementations must live in src/data/repositories', async () => {
    await expect(
      src.withName(/RepositoryImpl/).should().beInFolder('src/data/repositories'),
    ).toPassAsync(archOpts);
  });

  test('data sources must live in src/data/datasources', async () => {
    await expect(
      src.withName(/DataSource/).should().beInFolder('src/data/datasources'),
    ).toPassAsync(archOpts);
  });
});

// ---------------------------------------------------------------------------
// RULE 4 — Presentation layer only depends on contracts + domain use-case interfaces
//
//   ViewModels and screens consume domain use cases via interfaces.
//   They must NEVER directly instantiate repository impls or data sources.
// ---------------------------------------------------------------------------
describe('Rule 4 — Presentation layer only depends on contracts + domain', () => {
  test('presentation must not import from data layer', async () => {
    await expect(
      presentationLayer.shouldNot().dependOnFiles().inPath('src/data'),
    ).toPassAsync(archOpts);
  });

  test('presentation must not import from DI container', async () => {
    await expect(
      presentationLayer.shouldNot().dependOnFiles().inPath('src/di'),
    ).toPassAsync(archOpts);
  });

  test('ViewModels must live in src/presentation/viewmodels', async () => {
    await expect(
      src.withName(/ViewModel/).should().beInFolder('src/presentation/viewmodels'),
    ).toPassAsync(archOpts);
  });

  test('Screens must live in src/presentation/screen', async () => {
    await expect(
      src.withName(/Screen/).should().beInFolder('src/presentation/screen'),
    ).toPassAsync(archOpts);
  });

  test('screens must not directly import domain use case classes (only interfaces)', async () => {
    await expect(
      base()
        .inPath('src/presentation/screen')
        .shouldNot()
        .dependOnFiles()
        .withName(/UseCase\.ts$/),
    ).toPassAsync(archOpts);
  });
});

// ---------------------------------------------------------------------------
// RULE 5 — Only the DI container may wire all layers
//
//   The DI container is the composition root. It MUST be the only
//   file that imports from ALL layers simultaneously.
//   No other file outside src/di may import concrete implementations.
// ---------------------------------------------------------------------------
describe('Rule 5 — Only the DI container may wire all layers', () => {
  test('only DI container imports from data/repositories (impls)', async () => {
    await expect(
      srcOutsideDi
        .shouldNot()
        .dependOnFiles()
        .inPath('src/data/repositories'),
    ).toPassAsync(archOpts);
  });

  test('only DI container imports from data/datasources', async () => {
    await expect(
      srcOutsideDi.shouldNot().dependOnFiles().inPath('src/data/datasources'),
    ).toPassAsync(archOpts);
  });

  test('DI container must depend on all layers (it is the composition root)', async () => {
    // archunit's positive `dependOnFiles()` is not "every subject must reach target";
    // assert wiring via the project's path aliases instead.
    await expect(
      diContainer
        .should()
        .adhereTo(
          (f) =>
            /@domain\//.test(f.content) &&
            /@data\//.test(f.content) &&
            /@presentation\//.test(f.content),
          'DI container must import domain, data, and presentation',
        ),
    ).toPassAsync(archOpts);
  });
});

// ---------------------------------------------------------------------------
// RULE 6 — Naming conventions
//
//   Enforce naming patterns that make the layer of each file obvious
//   at a glance — without reading the path.
// ---------------------------------------------------------------------------
describe('Rule 6 — Naming conventions per layer', () => {
  test('contract interfaces must start with "I" prefix', async () => {
    await expect(
      contractsLayer
        .withName(/Contract\.ts$/)
        .should()
        .haveName(/^I[A-Z]/),
    ).toPassAsync(archOpts);
  });

  test('domain repository interfaces must start with "I" prefix', async () => {
    await expect(
      domainLayer.inPath('src/domain/repositories').should().haveName(/^I[A-Z]/),
    ).toPassAsync(archOpts);
  });

  test('domain use case classes must end with "UseCase"', async () => {
    await expect(
      domainLayer
        .inPath('src/domain/usecases')
        .withName(/UseCase/)
        .should()
        .haveName(/UseCase$/),
    ).toPassAsync(archOpts);
  });

  test('data repository implementations must end with "Impl"', async () => {
    await expect(
      dataLayer.inPath('src/data/repositories').should().haveName(/Impl\.ts$/),
    ).toPassAsync(archOpts);
  });

  test('ViewModels must end with "ViewModel"', async () => {
    await expect(
      presentationLayer
        .inPath('src/presentation/viewmodels')
        .should()
        .haveName(/ViewModel\.tsx?$/),
    ).toPassAsync(archOpts);
  });

  test('Screens must end with "Screen"', async () => {
    await expect(
      presentationLayer
        .inPath('src/presentation/screen')
        .should()
        .haveName(/Screen\.tsx$/),
    ).toPassAsync(archOpts);
  });
});

// ---------------------------------------------------------------------------
// RULE 7 — No circular dependencies anywhere in the module
// ---------------------------------------------------------------------------
describe('Rule 7 — No circular dependencies', () => {
  test('contracts layer has no circular dependencies', async () => {
    await expect(contractsLayer.should().haveNoCycles()).toPassAsync(archOpts);
  });

  test('domain layer has no circular dependencies', async () => {
    await expect(domainLayer.should().haveNoCycles()).toPassAsync(archOpts);
  });

  test('data layer has no circular dependencies', async () => {
    await expect(dataLayer.should().haveNoCycles()).toPassAsync(archOpts);
  });

  test('presentation layer has no circular dependencies', async () => {
    await expect(presentationLayer.should().haveNoCycles()).toPassAsync(archOpts);
  });
});

// ---------------------------------------------------------------------------
// RULE 8 — React Native is only allowed in the Presentation layer
//
//   Domain and Data layers must be framework-agnostic (testable without RN).
// ---------------------------------------------------------------------------
describe('Rule 8 — React Native imports are restricted to presentation', () => {
  const noReactNativeImport = (message: string) => ({
    message,
    condition: (file: { content: string }) =>
      !/from\s+['"]react-native['"]/.test(file.content),
  });

  test('domain layer must not import react-native', async () => {
    const { message, condition } = noReactNativeImport(
      'Domain files must not import react-native',
    );
    await expect(
      domainLayer.should().adhereTo(condition, message),
    ).toPassAsync(archOpts);
  });

  test('data layer must not import react-native', async () => {
    const { message, condition } = noReactNativeImport(
      'Data files must not import react-native',
    );
    await expect(
      dataLayer.should().adhereTo(condition, message),
    ).toPassAsync(archOpts);
  });

  test('contracts layer must not import react-native', async () => {
    const { message, condition } = noReactNativeImport(
      'Contract files must not import react-native',
    );
    await expect(
      contractsLayer.should().adhereTo(condition, message),
    ).toPassAsync(archOpts);
  });
});
