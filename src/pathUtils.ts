import * as path from 'path';

export function toAbsolutePath(relativePath: string, relativeTo: string) {
    return path.isAbsolute(relativePath)
        ? relativePath
        : path.resolve(path.dirname(relativeTo), relativePath);
}

export function normalizePath(unnormalizedPath: string) {
    return usePlatformSpecificSeparator(
        driveLetterToLowerCase(
            path.normalize(unnormalizedPath)));
}

function driveLetterToLowerCase(unnormalizedPath: string) {
    if (unnormalizedPath.length === 0) {
        return unnormalizedPath;
    }

    return unnormalizedPath.replace(/^[A-Z](?=:[\\\/])/, unnormalizedPath[0].toLowerCase());
}

function usePlatformSpecificSeparator(unnormalizedPath: string) {
    return unnormalizedPath.replace(/[\\\/]/, path.sep);
}