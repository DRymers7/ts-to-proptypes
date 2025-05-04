import {CodeBlockWriter, Project} from 'ts-morph';
import generateComponentString from './generator';
import {ComponentInfo} from './interfaces/ComponentInfo';
import {WriteOptions} from './types';
import {formatSingleFile} from './formatter';

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
    if (!componentInfo.props.length) return;

    const src = componentInfo.sourceFilePath;
    let out = src.replace(/\.tsx?$/, '.propTypes.ts');
    if (options.outDir) {
        const fn = out.split('/').pop();
        out = `${options.outDir}/${fn}`;
    }

    const file = options.inline
        ? currentProject.getSourceFileOrThrow(src)
        : currentProject.createSourceFile(out, '', {overwrite: true});

    if (!file.getImportDeclaration('prop-types')) {
        file.addImportDeclaration({
            moduleSpecifier: 'prop-types',
            defaultImport: 'PropTypes',
        });
    }

    file.addStatements((w) => w.write(generateComponentString(componentInfo)));
    await file.save();
    if (options.prettier) {
        const target = options.inline ? src : out;
        await formatSingleFile(target);
    }
}

export {createSourceFile};
