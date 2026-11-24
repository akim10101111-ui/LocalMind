/**
 * Utility functions for HuggingFace model processing
 * Centralizes siblings processing, filtering, and normalization logic
 */

import {urls} from '../config';
import {fetchModelFilesDetails, fetchModelInfo} from '../api/hf';
import type {HuggingFaceModel, ModelFile} from './types';

// Regex pattern for detecting sharded GGUF files
const RE_GGUF_SHARD_FILE =
  /^(?<prefix>.*?)-(?<shard>\d{5})-of-(?<total>\d{5})\.gguf$/;

/**
 * Filters out non-GGUF and sharded GGUF files from model siblings
 * @param siblings - Array of model files/siblings
 * @returns Filtered array containing only valid GGUF files
 */
export function filterValidGGUFFiles(siblings: any[]): any[] {
  return (
    siblings?.filter(sibling => {
      const filename = sibling.rfilename?.toLowerCase() || '';
      return filename.endsWith('.gguf') && !RE_GGUF_SHARD_FILE.test(filename);
    }) || []
  );
}

/**
 * Adds proper download URLs to model files based on modelId
 * @param modelId - The HuggingFace model ID (e.g., "microsoft/DialoGPT-medium")
 * @param siblings - Array of model files
 * @returns Array of siblings with download URLs added
 */
export function addModelFileDownloadUrls(
  modelId: string,
  siblings: any[],
): ModelFile[] {
  return siblings.map(sibling => ({
    ...sibling,
    url: urls.modelDownloadFile(modelId, sibling.rfilename),
  }));
}

/**
 * Normalizes model siblings array to ensure consistent format
 * Filters GGUF files and adds download URLs
 * @param modelId - The HuggingFace model ID
 * @param siblings - Raw siblings array from HF API
 * @returns Normalized siblings array with consistent format
 */
export function normalizeModelSiblings(
  modelId: string,
  siblings: any[],
): ModelFile[] {
  const filteredSiblings = filterValidGGUFFiles(siblings);
  return addModelFileDownloadUrls(modelId, filteredSiblings);
}

/**
 * Processes HuggingFace search results to ensure consistent format
 * - Adds model web page URL
 * - Filters and normalizes siblings array
 * @param models - Array of HuggingFace models from search results
 * @returns Processed models with normalized siblings
 */
export function processHFSearchResults(
  models: HuggingFaceModel[],
): HuggingFaceModel[] {
  return models.map(model => ({
    ...model,
    url: urls.modelWebPage(model.id),
    siblings: normalizeModelSiblings(model.id, model.siblings || []),
  }));
}

/**
 * Creates normalized siblings array from file details (used in PalStore)
 * @param modelId - The HuggingFace model ID
 * @param fileDetails - Array of file details from HF API
 * @returns Normalized siblings array matching HFStore format
 */
export function createSiblingsFromFileDetails(
  modelId: string,
  fileDetails: any[],
): ModelFile[] {
  // Convert file details to siblings format
  const siblings = fileDetails.map(file => ({
    rfilename: file.path,
    size: file.size,
    oid: file.oid,
    lfs: file.lfs,
  }));

  // Apply the same normalization as HFStore
  return normalizeModelSiblings(modelId, siblings);
}

/**
 * Checks if a filename represents a sharded GGUF file
 * @param filename - The filename to check
 * @returns True if the file is a sharded GGUF file
 */
export function isShardedGGUFFile(filename: string): boolean {
  return RE_GGUF_SHARD_FILE.test(filename);
}

/**
 * Checks if a filename is a valid GGUF file (not sharded)
 * @param filename - The filename to check
 * @returns True if the file is a valid GGUF file
 */
export function isValidGGUFFile(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return lowerFilename.endsWith('.gguf') && !isShardedGGUFFile(filename);
}


/**
 * Resolve a Hugging Face repository into the complete model shape used by
 * the model-details sheet. Model metadata and the recursive file tree are
 * fetched in parallel; file entries are normalized through the same GGUF
 * filtering and URL builder used by search results.
 */
export async function resolveHFRepo(
  repoId: string,
  authToken?: string | null,
): Promise<HuggingFaceModel> {
  const normalizedRepoId = repoId.trim();
  if (!normalizedRepoId || !normalizedRepoId.includes('/')) {
    throw new Error('A valid Hugging Face repository ID is required.');
  }

  const [info, fileDetails] = await Promise.all([
    fetchModelInfo({repoId: normalizedRepoId, full: true, authToken}),
    fetchModelFilesDetails(normalizedRepoId, authToken),
  ]);

  const author = normalizedRepoId.split('/')[0];
  return {
    _id: info._id ?? normalizedRepoId,
    id: info.id ?? normalizedRepoId,
    author: info.author ?? author,
    gated: info.gated ?? false,
    inference: info.inference ?? 'unknown',
    lastModified: info.lastModified ?? '',
    likes: info.likes ?? 0,
    trendingScore: info.trendingScore ?? 0,
    private: info.private ?? false,
    sha: info.sha ?? '',
    downloads: info.downloads ?? 0,
    tags: info.tags ?? [],
    library_name: info.library_name ?? '',
    createdAt: info.createdAt ?? '',
    model_id: info.model_id ?? normalizedRepoId,
    siblings: createSiblingsFromFileDetails(normalizedRepoId, fileDetails),
    url: info.url ?? urls.modelWebPage(normalizedRepoId),
    ...(info.specs ? {specs: info.specs} : {}),
  };
}
