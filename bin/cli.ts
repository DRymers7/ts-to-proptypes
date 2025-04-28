#!/usr/bin/env node
import {Project} from 'ts-morph';
import {parseComponents} from '../src/parser';

/**
 * Creation of a new ts-morph project.
 */
const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
});

/**
 * Adding all source components to the project.
 */
project.addSourceFilesAtPaths([
    'src/**/*.tsx', 
]);

/**
 * Getting the source files.
 */
const sourceFiles = project.getSourceFiles();

/**
 * Calling parseComponents() on each source file.
 */
sourceFiles.forEach((sourceFile) => {
    const components = parseComponents(sourceFile);
    console.log(components);
});
