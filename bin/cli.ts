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
    try {
        const project = new Project({
            tsConfigFilePath: 'tsconfig.json',
        });
        const sourceGlob = options.source;
        project.addSourceFilesAtPaths([sourceGlob]);

        // Add all source .tsx files
        project.addSourceFilesAtPaths(['src/**/*.tsx']);

        const sourceFiles = project.getSourceFiles();
        console.log(`Processing ${sourceFiles.length} source files...`);

        let processedComponentCount = 0;

        for (const sourceFile of sourceFiles) {
            try {
                const components: ComponentInfo[] =
                    await parseComponents(sourceFile);

                if (components.length === 0) {
                    console.log(
                        `No components found in: ${sourceFile.getFilePath()}`
                    );
                    continue;
                }

                console.log(
                    `Found ${components.length} components in: ${sourceFile.getFilePath()}`
                );

                for (const component of components) {
                    if (!component.props || component.props.length === 0) {
                        console.log(
                            `Skipping ${component.name}: No props found`
                        );
                        continue;
                    }

                    await createSourceFile(component, project, {
                        outDir: options.outDir,
                        inline: options.inline,
                        prettier: options.prettier,
                    });
                    processedComponentCount++;
                }
            } catch (err) {
                console.error(
                    `Error parsing file: ${sourceFile.getFilePath()}`
                );
                console.error(err);
            }
        }
        console.log(
            `Successfully processed ${processedComponentCount} components`
        );

        await project.save();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
