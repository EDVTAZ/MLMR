import { FileContent } from 'use-file-picker/types';

export function stringCompare(a: string, b: string) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function getRegexComparer(regex: string) {
  return (a: string, b: string) => {
    try {
      const aGroups = a.match(regex)?.groups;
      const bGroups = b.match(regex)?.groups;

      if (!aGroups && !bGroups) return 0;
      if (!aGroups) return 1;
      if (!bGroups) return -1;

      for (let i = 0; `int${i}` in aGroups || `string${i}` in aGroups; ++i) {
        let comp = 0;
        if (`int${i}` in aGroups) {
          comp = parseInt(aGroups[`int${i}`]) - parseInt(bGroups[`int${i}`]);
        } else if (`string${i}` in aGroups) {
          comp = stringCompare(aGroups[`string${i}`], bGroups[`string${i}`]);
        }
        if (comp !== 0) return comp;
      }
      return 0;
    } catch (e) {
      return 1;
    }
  };
}

export function orderFiles(
  filesContent: FileContent<ArrayBuffer>[],
  orderBy: string | false
) {
  if (orderBy) {
    const comparer = getRegexComparer(orderBy);
    filesContent = [...filesContent].sort((a, b) => comparer(a.name, b.name));
  }
  return filesContent;
}
