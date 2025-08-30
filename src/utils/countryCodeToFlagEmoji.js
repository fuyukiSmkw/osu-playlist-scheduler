export function countryCodeToFlagEmoji(countryCode) {
    if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
        return '[?]'; // Handle invalid input
    }

    const code = countryCode.toUpperCase();
    const firstChar = code.charCodeAt(0) - 65 + 127462;
    const secondChar = code.charCodeAt(1) - 65 + 127462;
    return String.fromCodePoint(firstChar, secondChar);
}
