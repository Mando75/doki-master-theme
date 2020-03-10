// @ts-ignore
import {DokiThemeDefinitions, DokiThemeTemplateDefinition, StringDictonary} from './types';
import { omit } from 'lodash';

const path = require('path');

const repoDirectory = path.resolve(__dirname, '..');

const fs = require('fs');

const masterThemeDefinitionDirectoryPath =
    path.resolve(repoDirectory, 'definitions');

function walkDir(dir: string): Promise<string[]> {
    const values: Promise<string[]>[] = fs.readdirSync(dir)
        .map((file: string) => {
            const dirPath: string = path.join(dir, file);
            const isDirectory = fs.statSync(dirPath).isDirectory();
            if (isDirectory) {
                return walkDir(dirPath);
            } else {
                return Promise.resolve([path.join(dir, file)]);
            }
        });
    return Promise.all(values)
        .then((scannedDirectories) => scannedDirectories
            .reduce((accum, files) => accum.concat(files), []));
}


const readJson = <T>(jsonPath: string): T =>
    JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));


console.log('Preparing to generate themes.');
walkDir(masterThemeDefinitionDirectoryPath)
    .then(files => files.filter(file => file.endsWith('doki.json')))
    .then(dokiFileDefinitionPaths => {
        return {
            dokiFileDefinitionPaths
        };
    })
    .then(templatesAndDefinitions => {
        const {
            dokiFileDefinitionPaths
        } = templatesAndDefinitions;
        return dokiFileDefinitionPaths
            .map(dokiFileDefinitionPath => ({
                dokiFileDefinitionPath,
                dokiThemeDefinition: readJson<DokiThemeTemplateDefinition>(dokiFileDefinitionPath),
            }))
    }).then(dokiThemes => {
    const themeDirectory = path.resolve(repoDirectory, 'temp', 'master');
    if (fs.existsSync(themeDirectory)) {
        fs.rmdirSync(themeDirectory, {recursive: true});
    }

    dokiThemes.forEach(dokiTheme => {
        const {
            dokiFileDefinitionPath,
            dokiThemeDefinition
        } = dokiTheme;
        const destinationPath = dokiFileDefinitionPath.substr(masterThemeDefinitionDirectoryPath.length);
        const essentials = omit(dokiThemeDefinition, ['ui', 'icons', 'overrides', 'editorScheme']);

        const fullFilePath = path.join(themeDirectory, destinationPath);

        fs.mkdirSync(
            path.resolve(fullFilePath,'..'),
            {
                recursive: true
            }
        );

        const definitionAsString = JSON.stringify(
            essentials, null, 2
        );

        fs.writeFileSync(
            fullFilePath.replace('doki.json', 'master.definition.json'),
            definitionAsString
        );
    })
})
    .then(() => {
        console.log('Theme Generation Complete!');
    });
