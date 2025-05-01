#!/usr/bin/env node
import {Project} from 'ts-morph';
import {parseComponents} from '../src/parser';
import {createSourceFile} from '../src/writer';
import {ComponentInfo} from '../src/interfaces/ComponentInfo';
import {Command} from 'commander';
import path from 'path';
import {SourceFile} from 'ts-morph';

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
 * Simple safety function to ensure that we aren't generating proptypes on the files
 * of ts-to-proptypes itself.
 *
 * @param sourceFiles source files array from the ts-morph project object
 * @param packageDir absolute path of the package root
 * @param sourceGlob designated source glob passed in by the user via CLI args
 * @returns array of sourcefiles to process
 */
function determineSourceFiles(
    sourceFiles: SourceFile[],
    packageDir: string,
    sourceGlob: any
): SourceFile[] {
    return sourceFiles.filter((file) => {
        const filePath = file.getFilePath();
        if (
            filePath.startsWith(packageDir + '/src/') &&
            !filePath.includes(sourceGlob.replace(/\*/g, ''))
        ) {
            console.log(`Skipping internal file: ${filePath}`);
            return false;
        }
        return true;
    });
}

/**
 * Function responsible for the parse component workflow, and validating that some level
 * of components are being processed. Will execute asynchronously and resole to an array of ComponentInfo objects.
 *
 * @param sourceFile sourcefile currently being processed.
 * @returns array of ComponentInfo, with prop information on the source file.
 */
async function handleComponentParsing(
    sourceFile: SourceFile
): Promise<ComponentInfo[]> {
    try {
        const components: ComponentInfo[] = await parseComponents(sourceFile);

        if (components.length === 0) {
            console.warn(`No components found in: ${sourceFile.getFilePath()}`);
        }
        console.log(
            `Found ${components.length} components in: ${sourceFile.getFilePath()}`
        );
        return components;
    } catch (error) {
        console.error(`Error parsing components: ${error}`);
        throw error;
    }
}

/**
 * Function responsible for calling prop file generation flow.
 *
 * @param component individual component extracted from parsed componentInfo
 * @param project current project being worked on in context.
 * @returns void - this method will generate new proptype files in the specified out directory.
 */
async function handlePropFileCreation(
    component: ComponentInfo,
    project: Project
): Promise<void> {
    if (!component.props || component.props.length === 0) {
        console.log(`Skipping ${component.name}: No props found`);
        return;
    }

    await createSourceFile(component, project, {
        outDir: options.outDir,
        inline: options.inline,
        prettier: options.prettier,
    });
}

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
        const packageDir = path.resolve(__dirname, '..');
        const sourceFiles = determineSourceFiles(
            project.getSourceFiles(),
            packageDir,
            sourceGlob
        );
        console.log(`Processing ${sourceFiles.length} source files...`);
        for (const sourceFile of sourceFiles) {
            const components: ComponentInfo[] =
                await handleComponentParsing(sourceFile);
            for (const component of components) {
                await handlePropFileCreation(component, project);
            }
        }
        await project.save();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
