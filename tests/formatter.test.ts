// tests/formatter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatWithPrettier, formatSingleFile } from '../src/formatter';
import * as fs from 'fs/promises';
import path from 'path';

// Mock fs.promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// This will be our prettier mock that we can manipulate in tests
const prettierMock = {
  format: vi.fn().mockResolvedValue('// Formatted content'),
  resolveConfig: vi.fn().mockResolvedValue({ semi: false })
};

// Mock the dynamic import of prettier
vi.mock('prettier', async () => {
  return {
    default: prettierMock
  };
});

describe('prettierFormat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (fs.readFile as unknown as vi.Mock).mockResolvedValue('// Original content');
    prettierMock.resolveConfig.mockResolvedValue({ semi: false });
    prettierMock.format.mockResolvedValue('// Formatted content');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatWithPrettier', () => {
    it('should format files successfully with available prettier configuration', async () => {
      // Setup
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const filePaths = ['/path/to/file1.ts', '/path/to/file2.ts'];
      
      // Execute
      const result = await formatWithPrettier(filePaths, true);
      
      // Verify
      expect(result).toEqual(filePaths);
      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
      expect(prettierMock.resolveConfig).toHaveBeenCalledTimes(1);
      expect(prettierMock.format).toHaveBeenCalledTimes(2);
      expect(prettierMock.format).toHaveBeenCalledWith(
        '// Original content', 
        expect.objectContaining({ 
          semi: false,
          filepath: expect.any(String) 
        })
      );
    });

    it('should return empty array when no files are provided', async () => {
      const result = await formatWithPrettier([]);
      expect(result).toEqual([]);
      expect(fs.readFile).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle missing prettier configuration gracefully', async () => {
      // Setup prettier to return null config
      prettierMock.resolveConfig.mockResolvedValue(null);
      const filePaths = ['/path/to/file.ts'];
      
      // Execute
      const result = await formatWithPrettier(filePaths, true);
      
      // Verify
      expect(result).toEqual(filePaths);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(prettierMock.format).toHaveBeenCalledWith(
        '// Original content', 
        expect.objectContaining({ 
          filepath: expect.any(String) 
        })
      );
    });

    it('should handle errors during file reading gracefully', async () => {
      // Setup file reading to fail for one file
      (fs.readFile as unknown as vi.Mock).mockImplementation((path) => {
        if (path === '/path/to/file1.ts') {
          return Promise.reject(new Error('File read error'));
        }
        return Promise.resolve('// Original content');
      });
      
      const filePaths = ['/path/to/file1.ts', '/path/to/file2.ts'];
      
      // Execute
      const result = await formatWithPrettier(filePaths, true);
      
      // Verify - should only return the successfully formatted file
      expect(result).toEqual(['/path/to/file2.ts']);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during prettier formatting gracefully', async () => {
      // Setup prettier format to fail for one file
      prettierMock.format.mockImplementation((content, options) => {
        if (options.filepath === '/path/to/file1.ts') {
          return Promise.reject(new Error('Format error'));
        }
        return Promise.resolve('// Formatted content');
      });
      
      const filePaths = ['/path/to/file1.ts', '/path/to/file2.ts'];
      
      // Execute
      const result = await formatWithPrettier(filePaths, true);
      
      // Verify - should only return the successfully formatted file
      expect(result).toEqual(['/path/to/file2.ts']);
      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('formatSingleFile', () => {
    it('should format a single file successfully', async () => {
      // Execute
      const result = await formatSingleFile('/path/to/file.ts');
      
      // Verify
      expect(result).toBe(true);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('should return false when formatting fails', async () => {
      // Setup prettier format to fail
      prettierMock.format.mockRejectedValue(new Error('Format error'));
      
      // Execute
      const result = await formatSingleFile('/path/to/file.ts');
      
      // Verify
      expect(result).toBe(false);
    });
  });
});