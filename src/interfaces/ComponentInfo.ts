import {ParsedProp} from './ParsedProp';

/**
 * Interface representation of parsed component information. Should consist of:
 * 1. Component name as string
 * 2. List of parsed props in the component (functional or class)
 * 3. Path to source file as string
 */
export interface ComponentInfo {
    name: string;
    propse: ParsedProp[];
    sourceFilePath: string;
}
