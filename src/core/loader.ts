import logger from '../logger.js';
import type { AhkIndex } from '../types/index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Global data storage - loaded lazily
let ahkIndex: AhkIndex | null = null;
let ahkDocumentationFull: any = null;

function resolveDataPath(rel: string): string {
  // Resolve relative to this module at runtime (works in dist and src builds)
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, '..', '..', 'data', rel);
}

async function dynamicJsonImport<T = any>(relPathFromData: string): Promise<T> {
  const relFromCore = `../../data/${relPathFromData}`;
  // Prefer import attributes when available (Node >= 20)
  try {
    const mod = await import(relFromCore, { with: { type: 'json' } } as any);
    // Some bundlers put value on .default
    return (mod as any).default ?? (mod as any);
  } catch (err) {
    // Fallback to filesystem read for older Node versions
    try {
      const abs = resolveDataPath(relPathFromData);
      const text = fs.readFileSync(abs, 'utf8');
      return JSON.parse(text);
    } catch (fsErr) {
      logger.error('Failed to load JSON data:', relPathFromData, fsErr);
      throw fsErr;
    }
  }
}

/**
 * Load all AutoHotkey documentation data from direct imports
 */
export async function loadAhkData(): Promise<void> {
  try {
    const mode = (process.env.AHK_MCP_DATA_MODE || '').toLowerCase();
    const lightMode = mode === 'light' || process.env.AHK_MCP_LIGHT === '1';
    logger.info(`Loading AutoHotkey documentation data (mode=${lightMode ? 'light' : 'full'})...`);

    // Always load the lightweight index first
    ahkIndex = (await dynamicJsonImport<AhkIndex>('ahk_index.json')) as AhkIndex;

    if (!lightMode) {
      // Load additional documentation datasets
      ahkDocumentationFull = await dynamicJsonImport<any>('ahk_documentation_full.json');
    } else {
      ahkDocumentationFull = null;
    }

    logger.info(`Loaded AHK index with ${ahkIndex.functions?.length || 0} functions, ${ahkIndex.classes?.length || 0} classes`);
    if (!lightMode) {
      logger.info('Loaded full AutoHotkey documentation and search index');
    } else {
      logger.info('Light mode enabled: skipped loading full documentation datasets');
    }
    logger.info('AutoHotkey documentation data loaded successfully');
  } catch (error) {
    logger.error('Failed to load AutoHotkey documentation data:', error);
    throw error;
  }
}

/**
 * Get the loaded AHK index
 */
export function getAhkIndex(): AhkIndex | null {
  return ahkIndex;
}

/**
 * Get the full documentation
 */
export function getAhkDocumentationFull(): any {
  return ahkDocumentationFull;
}


/**
 * Search for functions by name or keyword
 */
export function searchFunctions(query: string): any[] {
  if (!ahkIndex) return [];
  
  const normalizedQuery = query.toLowerCase();
  return ahkIndex.functions.filter(func =>
    func.Name.toLowerCase().includes(normalizedQuery) ||
    func.Description.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Search for classes by name or keyword
 */
export function searchClasses(query: string): any[] {
  if (!ahkIndex) return [];
  
  const normalizedQuery = query.toLowerCase();
  return ahkIndex.classes.filter(cls =>
    cls.Name.toLowerCase().includes(normalizedQuery) ||
    cls.Description.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Search for variables by name or keyword
 */
export function searchVariables(query: string): any[] {
  if (!ahkIndex) return [];
  
  const normalizedQuery = query.toLowerCase();
  return ahkIndex.variables.filter(variable =>
    variable.Name.toLowerCase().includes(normalizedQuery) ||
    variable.Description.toLowerCase().includes(normalizedQuery)
  );
}

// Removed unused: getFunctionByName, getClassByName, getMethodByName

/**
 * Initialize data loading
 */
export async function initializeDataLoader(): Promise<void> {
  await loadAhkData();
} 
