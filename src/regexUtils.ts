export function matchMany(text: string, pattern: RegExp) {
    const matches: RegExpExecArray[] = [];

    let match: RegExpExecArray | null;
    while (match = pattern.exec(text)) {
        matches.push(match);
    }

    return matches;
}