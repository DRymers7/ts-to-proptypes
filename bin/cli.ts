#!/usr/bin/env node
import {Project} from 'ts-morph';
import {parseComponents} from '../src/parser';
import {createSourceFile} from '../src/writer';
import {ComponentInfo} from '../src/interfaces/ComponentInfo';
import {Command} from 'commander';

/**
 * Setup of CLI options and arguments handling
 */
const program = new Command();
program
    .name('ts-proptypes-gen')
    .description('CLI to generate PropTypes from TypeScript components')
    .option('-s, --source <source>', 'Glob of source files', 'src/**/*.tsx')
    .option('-o, --outDir <outDir>', 'Directory to place generated files')
    .option('--inline', 'Append PropTypes into the original file')
    .option('--prettier', 'Format generated files using Prettier');
program.parse();
const options = program.opts();

/**
 * Entrypoint to the ts-to-props package. This will facilitate the
 * detection of props, correct parsing, and then file generation in the project.
 */
async function main() {
    const project = new Project({
        tsConfigFilePath: 'tsconfig.json',
    });
    const sourceGlob = options.source;
    project.addSourceFilesAtPaths([sourceGlob]);

    // Add all source .tsx files
    project.addSourceFilesAtPaths(['src/**/*.tsx']);

    const sourceFiles = project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
        try {
            const components: ComponentInfo[] =
                await parseComponents(sourceFile);

            for (const component of components) {
                await createSourceFile(component, project, {
                    outDir: options.outDir,
                    inline: options.inline,
                    prettier: options.prettier,
                });
            }
        } catch (err) {
            console.error(`Error parsing file: ${sourceFile.getFilePath()}`);
            console.error(err);
        }
    }

    await project.save();
}

main();
