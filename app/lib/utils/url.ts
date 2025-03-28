
export function getParsedParamsArray({ paramsValue }: {
    paramsValue: string | null;
}) {

    const stringArray = paramsValue ?
        JSON.parse(decodeURIComponent(paramsValue || '')) as string[]
        : [];

    return stringArray;
}

export function trimQuotes(str: string): string {
    if (str.startsWith('"') && str.endsWith('"')) {
      return str.slice(1, -1);
    }
    return str;
  }