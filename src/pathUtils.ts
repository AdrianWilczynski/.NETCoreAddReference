import * as path from 'path';

export function toAbsolutePath(relativePath: string, relativeTo: string) {
    return path.isAbsolute(relativePath)
        ? relativePath
        : path.resolve(path.dirname(relativeTo), relativePath);
}

export function normalizePath(unnormalizedPath: string) {
    unnormalizedPath = path.normalize(unnormalizedPath);
    return unnormalizedPath.replace(/^[A-Z](?=:\\)/, unnormalizedPath[0].toLowerCase());
}