import {CodeBlockWriter, Project} from 'ts-morph';
import generateComponentString from './generator';
import {ComponentInfo} from './interfaces/ComponentInfo';
import {WriteOptions} from './types';
import {formatFile} from './formatFile';

/**
 * Takes the stringified component information and creates a new file
 * in the project with that information and generated prop types.
 *
 * @param componentStringInput returned string containing component information as a string
 * @param currentProject current project active in top level clil entry point.
 */
async function createSourceFile(
    componentInfo: ComponentInfo,
    currentProject: Project,
    options: WriteOptions
) {
    const sourceFilePath = componentInfo.sourceFilePath;
    let outputPath = sourceFilePath.replace(/\.tsx?$/, '.propTypes.ts');

    if (options.outDir) {
        // Rewrite path to output directory
        const fileName = outputPath.split('/').pop();
        outputPath = `${options.outDir}/${fileName}`;
    }

    let file;

    if (options.inline) {
        file = currentProject.getSourceFileOrThrow(sourceFilePath);
    } else {
        file = currentProject.createSourceFile(outputPath, '', {
            overwrite: true,
        });
    }

    if (!file.getImportDeclaration('prop-types')) {
        file.addImportDeclaration({
            moduleSpecifier: 'prop-types',
            defaultImport: 'PropTypes',
        });
    }

    file.addStatements((writer) => {
        writer.write(generateComponentString(componentInfo));
    });

    await file.save();

    if (options.prettier) {
        await formatFile(outputPath);
    }
}

export {createSourceFile};
