import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((_callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((_callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IndexedDB for lightning-fs
const mockIDBKeyRange = {
  bound: vi.fn(),
  only: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn(),
};

const mockIDBRequest = {
  result: null,
  error: null,
  source: null,
  transaction: null,
  readyState: 'done',
  onsuccess: null,
  onerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

const mockIDBObjectStore = {
  add: vi.fn().mockReturnValue(mockIDBRequest),
  clear: vi.fn().mockReturnValue(mockIDBRequest),
  count: vi.fn().mockReturnValue(mockIDBRequest),
  delete: vi.fn().mockReturnValue(mockIDBRequest),
  get: vi.fn().mockReturnValue(mockIDBRequest),
  getAll: vi.fn().mockReturnValue(mockIDBRequest),
  getAllKeys: vi.fn().mockReturnValue(mockIDBRequest),
  getKey: vi.fn().mockReturnValue(mockIDBRequest),
  put: vi.fn().mockReturnValue(mockIDBRequest),
  openCursor: vi.fn().mockReturnValue(mockIDBRequest),
  openKeyCursor: vi.fn().mockReturnValue(mockIDBRequest),
  createIndex: vi.fn(),
  deleteIndex: vi.fn(),
  index: vi.fn(),
  name: 'mockStore',
  keyPath: null,
  indexNames: [],
  transaction: null,
  autoIncrement: false,
};

const mockIDBTransaction = {
  abort: vi.fn(),
  commit: vi.fn(),
  objectStore: vi.fn().mockReturnValue(mockIDBObjectStore),
  db: null,
  mode: 'readonly',
  durability: 'default',
  error: null,
  onabort: null,
  oncomplete: null,
  onerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

const _mockIDBDatabase = {
  close: vi.fn(),
  createObjectStore: vi.fn().mockReturnValue(mockIDBObjectStore),
  deleteObjectStore: vi.fn(),
  transaction: vi.fn().mockReturnValue(mockIDBTransaction),
  name: 'mockDB',
  version: 1,
  objectStoreNames: [],
  onabort: null,
  onclose: null,
  onerror: null,
  onversionchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

const mockIDBOpenDBRequest = {
  ...mockIDBRequest,
  onblocked: null,
  onupgradeneeded: null,
};

global.indexedDB = {
  open: vi.fn().mockReturnValue(mockIDBOpenDBRequest),
  deleteDatabase: vi.fn().mockReturnValue(mockIDBRequest),
  databases: vi.fn().mockResolvedValue([]),
  cmp: vi.fn(),
};

global.IDBKeyRange = mockIDBKeyRange as unknown as typeof IDBKeyRange;