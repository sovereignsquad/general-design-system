'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { MediaPreviewCard, type MediaFit, type MediaPreviewAspectRatio } from './MediaPreviewCard';
import { UploadDropzone } from './UploadDropzone';
import { StateBlock } from './StateBlock';

/** How an asset's media is fitted in previews: the underlying `MediaFit` values plus `'crop'`. */
export type GdsAssetDisplayMode = MediaFit | 'crop';
/** Lifecycle state of an asset as it moves through validation, upload, and metadata capture. */
export type GdsAssetStatus = 'empty' | 'validating' | 'uploading' | 'processing' | 'ready' | 'failed' | 'retrying' | 'metadata-incomplete';

/** A managed media asset with its source, metadata, and current lifecycle status. */
export interface GdsAsset {
  id: string;
  url?: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  /** Size in bytes. */
  size: number;
  /** Alternative text; required before publish when the alt-text policy demands it. */
  alt?: string;
  caption?: string;
  status: GdsAssetStatus;
  displayMode?: GdsAssetDisplayMode;
}

/** Policy for which accessibility metadata must be present before an asset is `ready`. */
export interface GdsAltTextPolicy {
  /** Require non-empty alt text before the asset is considered complete. */
  requireAlt?: boolean;
  /** Require a non-empty caption before the asset is considered complete. */
  requireCaption?: boolean;
}

/** Validation policy for accepted file types and size, extending the alt-text requirements. */
export interface GdsAssetValidationPolicy extends GdsAltTextPolicy {
  /** Allowed MIME types; when set, other types fail validation. */
  acceptedTypes?: string[];
  /** Maximum file size in bytes. */
  maxSizeBytes?: number;
}

/** A single upload request handed to a {@link GdsAssetAdapter}. */
export interface GdsAssetUploadRequest {
  file: File;
  /** Abort signal wired to the queue's per-upload timeout. */
  signal?: AbortSignal;
  /** Progress callback (0–100) the adapter should call as bytes upload. */
  onProgress?: (progress: number) => void;
}

/** Pluggable transport for uploading, removing, and thumbnailing assets. */
export interface GdsAssetAdapter {
  upload: (request: GdsAssetUploadRequest) => Promise<GdsAsset>;
  remove?: (assetId: string) => Promise<void> | void;
  thumbnail?: (asset: GdsAsset) => Promise<string> | string;
}

/** One entry in the upload queue, tracking its file, resolved asset, progress, and error. */
export interface GdsAssetQueueItem {
  id: string;
  fileName: string;
  file?: File;
  asset?: GdsAsset;
  status: GdsAssetStatus;
  /** Upload progress, 0–100. */
  progress: number;
  error?: string;
}

/** A metadata-only queue event emitted for observability (never carries file contents). */
export interface GdsAssetEvent {
  type: 'asset_selected' | 'validation_failed' | 'upload_started' | 'upload_failed' | 'upload_retry' | 'metadata_saved';
  timestamp: number;
  /** Always `'metadata-only'` — a marker that no file bytes are included. */
  privacy: 'metadata-only';
  message?: string;
}

/** Configuration for {@link useGdsAssetUploadQueue}. */
export interface UseGdsAssetUploadQueueConfig {
  adapter: GdsAssetAdapter;
  policy?: GdsAssetValidationPolicy;
  onEvent?: (event: GdsAssetEvent) => void;
  /** Per-upload abort timeout in ms. Defaults to 10000. */
  timeoutMs?: number;
}

/** Imperative controller returned by {@link useGdsAssetUploadQueue}. */
export interface GdsAssetUploadQueueController {
  items: GdsAssetQueueItem[];
  selectFiles: (files: File[]) => Promise<void>;
  retry: (itemId: string) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  saveMetadata: (itemId: string, metadata: Pick<GdsAsset, 'alt' | 'caption' | 'displayMode'>) => void;
}

/** Props for {@link GdsAssetPreviewCard}. */
export interface GdsAssetPreviewCardProps {
  asset: GdsAsset;
  aspectRatio?: MediaPreviewAspectRatio;
  actions?: ReactNode;
}

/** Props for {@link GdsAssetManager}, combining the upload-queue config with presentation options. */
export interface GdsAssetManagerProps extends UseGdsAssetUploadQueueConfig {
  title: string;
  description?: string;
  /** Allow selecting more than one file. Defaults to `true`. */
  multiple?: boolean;
  displayMode?: GdsAssetDisplayMode;
}

function emitAssetEvent(onEvent: UseGdsAssetUploadQueueConfig['onEvent'], type: GdsAssetEvent['type'], message?: string) {
  onEvent?.({ type, message, timestamp: Date.now(), privacy: 'metadata-only' });
}

function assetIdFromFile(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/** Creates a default in-browser {@link GdsAssetAdapter} that uploads via `URL.createObjectURL` and leaves metadata incomplete. */
export function createGdsAssetAdapter(): GdsAssetAdapter {
  return {
    upload: async ({ file, onProgress }) => {
      onProgress?.(50);
      onProgress?.(100);
      return {
        id: assetIdFromFile(file),
        url: typeof URL !== 'undefined' && 'createObjectURL' in URL ? URL.createObjectURL(file) : undefined,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        status: 'metadata-incomplete',
      };
    },
  };
}

/** Validates a file against the accepted-types and max-size policy, returning `{ valid, message? }`. */
export function validateGdsAsset(file: File, policy: GdsAssetValidationPolicy = {}) {
  if (policy.acceptedTypes?.length && !policy.acceptedTypes.includes(file.type)) {
    return { valid: false, message: `Unsupported file type: ${file.type || 'unknown'}.` };
  }
  if (policy.maxSizeBytes && file.size > policy.maxSizeBytes) {
    return { valid: false, message: `File is larger than ${policy.maxSizeBytes} bytes.` };
  }
  return { valid: true };
}

function metadataComplete(asset: GdsAsset, policy: GdsAltTextPolicy = {}) {
  if (policy.requireAlt && !asset.alt?.trim()) return false;
  if (policy.requireCaption && !asset.caption?.trim()) return false;
  return true;
}

/**
 * Governed upload-queue hook: validates selected files, uploads them through the
 * adapter with a per-item timeout, tracks progress/retry/removal, and enforces
 * the alt-text/caption policy before an item reaches `ready`.
 */
export function useGdsAssetUploadQueue({
  adapter,
  policy = {},
  onEvent,
  timeoutMs = 10000,
}: UseGdsAssetUploadQueueConfig): GdsAssetUploadQueueController {
  const [items, setItems] = useState<GdsAssetQueueItem[]>([]);

  const uploadItem = useCallback(async (item: GdsAssetQueueItem) => {
    if (!item.file) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: item.status === 'failed' ? 'retrying' : 'uploading', progress: 0, error: undefined } : entry));
    emitAssetEvent(onEvent, item.status === 'failed' ? 'upload_retry' : 'upload_started');
    try {
      const asset = await adapter.upload({
        file: item.file,
        signal: controller.signal,
        onProgress: (progress) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, progress: Math.max(0, Math.min(100, progress)) } : entry)),
      });
      const thumbnail = adapter.thumbnail ? await adapter.thumbnail(asset) : asset.thumbnailUrl;
      const nextAsset = { ...asset, thumbnailUrl: thumbnail, status: metadataComplete(asset, policy) ? 'ready' as const : 'metadata-incomplete' as const };
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, asset: nextAsset, status: nextAsset.status, progress: 100 } : entry));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Upload failed.';
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'failed', error: message } : entry));
      emitAssetEvent(onEvent, 'upload_failed', message);
    } finally {
      window.clearTimeout(timer);
    }
  }, [adapter, onEvent, policy, timeoutMs]);

  const selectFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      const id = assetIdFromFile(file);
      emitAssetEvent(onEvent, 'asset_selected');
      const validation = validateGdsAsset(file, policy);
      const item: GdsAssetQueueItem = { id, fileName: file.name, file, status: validation.valid ? 'validating' : 'failed', progress: 0, error: validation.message };
      setItems((current) => current.some((entry) => entry.id === id) ? current : [...current, item]);
      if (!validation.valid) {
        emitAssetEvent(onEvent, 'validation_failed', validation.message);
      } else {
        await uploadItem(item);
      }
    }
  }, [onEvent, policy, uploadItem]);

  const retry = useCallback(async (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (item) await uploadItem(item);
  }, [items, uploadItem]);

  const remove = useCallback(async (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (item?.asset) await adapter.remove?.(item.asset.id);
    setItems((current) => current.filter((entry) => entry.id !== itemId));
  }, [adapter, items]);

  const saveMetadata = useCallback((itemId: string, metadata: Pick<GdsAsset, 'alt' | 'caption' | 'displayMode'>) => {
    setItems((current) => current.map((entry) => {
      if (entry.id !== itemId || !entry.asset) return entry;
      const asset = { ...entry.asset, ...metadata };
      const status = metadataComplete(asset, policy) ? 'ready' : 'metadata-incomplete';
      emitAssetEvent(onEvent, 'metadata_saved');
      return { ...entry, asset: { ...asset, status }, status };
    }));
  }, [onEvent, policy]);

  return { items, selectFiles, retry, remove, saveMetadata };
}

/** Renders a single asset as a governed {@link MediaPreviewCard}, mapping status to the card's state and showing type/size metadata. */
export function GdsAssetPreviewCard({ asset, aspectRatio = '1:1' }: GdsAssetPreviewCardProps) {
  return (
    <MediaPreviewCard
      title={asset.fileName}
      src={asset.url}
      thumbnailSrc={asset.thumbnailUrl}
      alt={asset.alt ?? ''}
      caption={asset.caption}
      fit={asset.displayMode === 'contain' ? 'contain' : 'cover'}
      aspectRatio={aspectRatio}
      state={asset.status === 'failed' ? 'error' : asset.url || asset.thumbnailUrl ? 'ready' : 'missing'}
      status={asset.status}
      metadata={[
        { label: 'Type', value: asset.mimeType },
        { label: 'Size', value: `${asset.size} bytes` },
      ]}
    />
  );
}

/**
 * End-to-end governed asset manager: a dropzone wired to {@link useGdsAssetUploadQueue},
 * per-item previews, retry controls, and inline alt-text/caption editing that gates
 * publish until the metadata policy is satisfied.
 */
export function GdsAssetManager({
  title,
  description,
  adapter,
  policy,
  onEvent,
  timeoutMs,
  multiple = true,
  displayMode = 'cover',
}: GdsAssetManagerProps) {
  const queue = useGdsAssetUploadQueue({ adapter, policy, onEvent, timeoutMs });
  const accept = useMemo(() => policy?.acceptedTypes?.join(',') ?? undefined, [policy]);

  return (
    <Stack gap="md">
      <UploadDropzone
        title={title}
        description={description}
        multiple={multiple}
        accept={accept}
        acceptedTypesLabel={policy?.acceptedTypes?.join(', ')}
        maxSizeLabel={policy?.maxSizeBytes ? `${policy.maxSizeBytes} bytes max` : undefined}
        onFilesSelected={(files) => { void queue.selectFiles(files); }}
        state={queue.items.length ? 'selected' : 'idle'}
        selectedFiles={queue.items.map((item) => item.fileName)}
      />
      {!queue.items.length ? <StateBlock variant="empty" title="No assets selected" description="Choose files to start the governed upload queue." compact /> : null}
      {queue.items.map((item) => (
        <Stack key={item.id} gap="xs">
          {item.asset ? <GdsAssetPreviewCard asset={{ ...item.asset, displayMode }} /> : <StateBlock variant={item.status === 'failed' ? 'error' : 'loading'} title={item.fileName} description={item.error ?? `${item.status} ${item.progress}%`} compact />}
          {item.status === 'failed' ? <Button onClick={() => { void queue.retry(item.id); }}>Retry upload</Button> : null}
          {item.asset ? (
            <Group align="end">
              <TextInput aria-label={`Alt text for ${item.fileName}`} label="Alt text" value={item.asset.alt ?? ''} onChange={(event) => queue.saveMetadata(item.id, { alt: event.currentTarget.value, caption: item.asset?.caption, displayMode })} />
              <TextInput aria-label={`Caption for ${item.fileName}`} label="Caption" value={item.asset.caption ?? ''} onChange={(event) => queue.saveMetadata(item.id, { alt: item.asset?.alt, caption: event.currentTarget.value, displayMode })} />
              <Button variant="light" color="red" onClick={() => { void queue.remove(item.id); }}>Remove</Button>
            </Group>
          ) : null}
          {item.status === 'metadata-incomplete' ? <Text role="alert" size="sm" c="red.7">Metadata incomplete. Alt text or caption is required before publish.</Text> : null}
        </Stack>
      ))}
    </Stack>
  );
}
