/**
 * Interface representation of a Prop. Should consist of:
 * 1. Prop name as str
 * 2. Prop type as str
 * 3. Required (boolean)
 */
export interface ParsedProp {
    name: string;
    type: string;
    required: boolean;
}
