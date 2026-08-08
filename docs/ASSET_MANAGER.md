# Asset Manager

Status: Active SSOT
Version: 4.1.5
Last updated: 2026-07-26

The GDS asset manager owns the UI state machine for media selection, validation, upload progress, retry, preview, metadata, alt text, captions, display modes, and failed asset recovery. Storage and upload infrastructure remain app-owned through adapters.

## Runtime API

- `createGdsAssetAdapter()`: local fixture adapter for demos/tests.
- `validateGdsAsset(file, policy)`: validates type and size before enqueue.
- `useGdsAssetUploadQueue(config)`: headless upload queue controller.
- `GdsAssetPreviewCard`: asset-aware preview wrapper over `MediaPreviewCard`.
- `GdsAssetManager`: governed upload and metadata workflow using `UploadDropzone`, `StateBlock`, preview cards, metadata inputs, retry, and remove controls.

## Asset States

- `empty`
- `validating`
- `uploading`
- `processing`
- `ready`
- `failed`
- `retrying`
- `metadata-incomplete`

## Adapter Contract

```ts
const adapter = {
  upload: async ({ file, signal, onProgress }) => uploadFile(file, { signal, onProgress }),
  remove: async (assetId) => removeAsset(assetId),
  thumbnail: async (asset) => createThumbnail(asset),
}
```

Adapters should honor `AbortSignal` and report bounded progress. GDS owns visible retry and terminal failure states.

## Alt And Caption Policy

`GdsAltTextPolicy` can require alt text and captions before publish. Missing metadata keeps assets in `metadata-incomplete` and renders visible status copy.

## Observability

`onEvent` emits metadata-only events:

- `asset_selected`
- `validation_failed`
- `upload_started`
- `upload_failed`
- `upload_retry`
- `metadata_saved`

Events never include files, asset URLs, secrets, credentials, or private media content.

## Rollback

The asset manager is additive. Existing `UploadDropzone`, `MediaField`, and `MediaPreviewCard` consumers remain supported while teams migrate upload flows one surface at a time.

## Verification

```bash
npm run test:run -- packages/gds-core/src/core.test.tsx
npm run verify:api-docs-coverage
npm run verify:release
```
