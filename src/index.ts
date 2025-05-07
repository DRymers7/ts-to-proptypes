// Core functionality exports
export { parseComponents } from './core/parser';
export { createSourceFile } from './core/writer';
export { normalizePropType } from './core/normalizePropType';
export { default as generateComponentString } from './core/generator';
export { default as extractPropsFromParameter } from './core/extractPropsFromParameter';

// Type exports
export type { ComponentInfo } from './core/parser';
export type { ParsedProp } from './core/extractPropsFromParameter';
export type { NormalizedPropType, WriteOptions, PropTypeValue, PrimitiveTypeName } from './types/types';

// Utils
export { formatWithPrettier, formatSingleFile } from './utils/formatter';
export { logger, LogLevel } from './utils/logger';