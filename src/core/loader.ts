import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../logger.js';
import type { AhkIndex } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global data storage
let ahkIndex: AhkIndex | null = null;
let ahkDocumentationFull: any = null;
let ahkDocumentationIndex: any = null;

// Data file paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const AHK_INDEX_PATH = path.join(DATA_DIR, 'ahk_index.json');
const AHK_DOCS_FULL_PATH = path.join(DATA_DIR, 'ahk_documentation_full.json');
const AHK_DOCS_INDEX_PATH = path.join(DATA_DIR, 'ahk_documentation_index.json');

/**
 * Load all AutoHotkey documentation data
 */
export async function loadAhkData(): Promise<void> {
  try {
    logger.info('Loading AutoHotkey documentation data...');
    
    // Check if data directory exists
    if (!await fs.pathExists(DATA_DIR)) {
      throw new Error(`Data directory not found: ${DATA_DIR}`);
    }
    
    // Load AHK index
    if (await fs.pathExists(AHK_INDEX_PATH)) {
      const indexData = await fs.readJson(AHK_INDEX_PATH);
      ahkIndex = indexData as AhkIndex;
      logger.info(`Loaded AHK index with ${ahkIndex.functions.length} functions, ${ahkIndex.classes.length} classes`);
    } else {
      logger.warn(`AHK index file not found: ${AHK_INDEX_PATH}`);
    }
    
    // Load full documentation
    if (await fs.pathExists(AHK_DOCS_FULL_PATH)) {
      ahkDocumentationFull = await fs.readJson(AHK_DOCS_FULL_PATH);
      logger.info('Loaded full AutoHotkey documentation');
    } else {
      logger.warn(`AHK full documentation file not found: ${AHK_DOCS_FULL_PATH}`);
    }
    
    // Load documentation index for semantic search
    if (await fs.pathExists(AHK_DOCS_INDEX_PATH)) {
      ahkDocumentationIndex = await fs.readJson(AHK_DOCS_INDEX_PATH);
      logger.info('Loaded AutoHotkey documentation search index');
    } else {
      logger.warn(`AHK documentation index file not found: ${AHK_DOCS_INDEX_PATH}`);
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
 * Get the documentation search index
 */
export function getAhkDocumentationIndex(): any {
  return ahkDocumentationIndex;
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

/**
 * Get function by exact name
 */
export function getFunctionByName(name: string): any | null {
  if (!ahkIndex) return null;
  
  return ahkIndex.functions.find(func =>
    func.Name.toLowerCase().startsWith(name.toLowerCase())
  ) || null;
}

/**
 * Get class by exact name
 */
export function getClassByName(name: string): any | null {
  if (!ahkIndex) return null;
  
  return ahkIndex.classes.find(cls =>
    cls.Name.toLowerCase() === name.toLowerCase()
  ) || null;
}

/**
 * Get method by class and method name
 */
export function getMethodByName(className: string, methodName: string): any | null {
  if (!ahkIndex) return null;
  
  return ahkIndex.methods.find(method =>
    method.Path.toLowerCase() === className.toLowerCase() &&
    method.Name.toLowerCase().includes(methodName.toLowerCase())
  ) || null;
}

/**
 * Initialize data loading
 */
export async function initializeDataLoader(): Promise<void> {
  await loadAhkData();
} 