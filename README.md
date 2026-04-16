# Analytics Module — Layered Architecture + ArchUnit

A React Native analytics module that enforces clean layer boundaries using
[ArchUnit](https://www.npmjs.com/package/archunit) (architecture testing for TypeScript). The architecture
mirrors the diagram with four layers wired by a single DI container.

```
┌─────────────────────────────────────────────────────────────┐
│                         Module                              │
│                                                             │
│  ┌──────────────────┐   ┌─────────────────────────────┐    │
│  │  Contracts layer │◄──│     Presentation layer      │    │
│  │                  │   │  ViewModels · RN Screens     │    │
│  │  ITelemetry-     │   └─────────────────────────────┘    │
│  │  Contract        │                                       │
│  │  IAnalyticsSDK-  │   ┌─────────────────────────────┐    │
│  │  Contract        │◄──│       Domain layer           │    │
│  │                  │   │  Use Cases · Repo interfaces │    │
│  └──────────────────┘   └─────────────────────────────┘    │
│                                                             │
│                         ┌─────────────────────────────┐    │
│                    ◄────│        Data layer            │    │
│                         │  Repositories · DataSources  │    │
│                         └─────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  DI Container                        │   │
│  │         Binds interfaces to implementations          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
  Layers consume contracts → DI / Service Locator injects impls
```

## Layer rules (enforced by ArchUnit)

| Layer | May import from | May NOT import from |
|---|---|---|
| **Contracts** | nothing | domain, data, presentation, di |
| **Domain** | contracts | data, presentation, di, react-native |
| **Data** | domain, contracts | presentation, di, react-native |
| **Presentation** | domain (interfaces), contracts | data (concrete), di, react-native in domain/data |
| **DI Container** | ALL layers | — (it is the composition root) |

## Project structure

```
src/
├── contracts/
│   ├── telemetry/         # ITelemetryContract
│   └── sdk/               # IAnalyticsSDKContract, IAuthContract
├── domain/
│   ├── repositories/      # IAnalyticsRepository (interfaces)
│   └── usecases/          # GetMetricsSummaryUseCase, TrackEventUseCase
├── data/
│   ├── datasources/       # AnalyticsRemoteDataSource, AnalyticsLocalDataSource
│   └── repositories/      # AnalyticsRepositoryImpl
├── presentation/
│   ├── viewmodels/        # AnalyticsDashboardViewModel
│   └── screens/           # AnalyticsDashboardScreen.tsx
└── di/
    └── AnalyticsDIContainer.ts   ← composition root

tests/
└── arch/
    └── architecture.rules.test.ts  ← folder naming rules (5 rule suites)
```

## Running the architecture checks

```bash
# Install dependencies
npm install

# Run ONLY the architecture rules
npm run arch:check

# Run all tests
npm test

# Generate a JSON report
npm run arch:report
```

## Architecture rules at a glance

| Rule | What it checks |
|---|---|
| **Rule 1** | Domain layer folder structure: UseCases in `src/domain/usecases`, Repositories in `src/domain/repositories` |
| **Rule 2** | Data layer folder structure: RepositoryImpl in `src/data/repositories`, DataSources in `src/data/datasources` |
| **Rule 3** | Presentation layer folder structure: ViewModels in `src/presentation/viewmodels`, Screens in `src/presentation/screen` |
| **Rule 4** | Contracts layer naming: Contract interfaces must start with `I` prefix |
| **Rule 5** | DI folder structure: Files in `src/di` must follow DI naming conventions (DIContainer, Factory, Provider, etc.) |

## Extending the module

When adding a new feature (e.g., `UserSegmentation`):

1. **Contracts** — add `IUserSegmentationContract.ts` if the host app must implement something
2. **Domain** — add `IUserSegmentationRepository.ts` + `GetUserSegmentsUseCase.ts`
3. **Data** — add `UserSegmentationRepositoryImpl.ts` + data source
4. **Presentation** — add `UserSegmentationViewModel.ts` + `UserSegmentationScreen.tsx`
5. **DI** — wire the new bindings in `AnalyticsDIContainer.ts` (add factory methods, update provider)

The ArchUnit tests will **fail automatically** if you accidentally import a
concrete class from the wrong layer, saving you from discovering the violation
at runtime.

## Continuous Integration & Deployment

This project uses **GitHub Actions** to automatically:

1. **Run tests** on every push and pull request (Node 18.x + 20.x)
2. **Enforce architecture rules** via ArchUnit tests
3. **Generate reports** and upload artifacts
4. **Deploy documentation** to GitHub Pages (main branch only)

### Setup GitHub Pages

1. Go to your repository **Settings → Pages**
2. Select **Deploy from a branch**
3. Choose **`gh-pages`** branch and root `/` folder
4. Save

The workflow automatically creates and deploys to `gh-pages` on every push to `main`.

### View Results

- **Architecture Report**: Download from Actions → workflow run → Artifacts
- **Documentation Site**: `https://<your-username>.github.io/<repo-name>`
