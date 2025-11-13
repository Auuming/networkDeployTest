import React from 'react';

/**
 * Lightweight inline formatter supporting:
 *  - *bold*    (surrounded by asterisks)
 *  - _italic_  (surrounded by underscores)
 *  - +underline+ (surrounded by plus signs)
 *  - ~~strikethrough~~ (surrounded by double tildes)
 *
 * This parser is intentionally simple: it finds markers and returns an
 * array of React nodes. It does not support nested formatting or escaping.
 */
export default function formatText(text: string): React.ReactNode {
    if (!text) return text;

    const parts: React.ReactNode[] = [];
    // Match tokens - order matters (longer/double markers first):
    //  - ~~strike~~, *bold*, _italic_, +underline+
    const regex = /(~~[^~]+~~|\*[^*]+\*|_[^_]+_|\+[^+]+\+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        const idx = match.index;
        if (idx > lastIndex) {
            parts.push(text.slice(lastIndex, idx));
        }

        const token = match[0];
        // strip markers
        if (token.startsWith('*') && token.endsWith('*')) {
            parts.push(
                <strong key={parts.length}>
                    {token.slice(1, -1)}
                </strong>
            );
        } else if (token.startsWith('_') && token.endsWith('_')) {
            parts.push(
                <em key={parts.length}>
                    {token.slice(1, -1)}
                </em>
            );
        } else if (token.startsWith('~~') && token.endsWith('~~')) {
            parts.push(
                <del key={parts.length}>
                    {token.slice(2, -2)}
                </del>
            );
        } else if (token.startsWith('+') && token.endsWith('+')) {
            parts.push(
                <u key={parts.length}>
                    {token.slice(1, -1)}
                </u>
            );
        } else {
            parts.push(token);
        }

        lastIndex = idx + token.length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    // If no tokens found, return original string
    if (parts.length === 0) return text;
    return parts;
}
