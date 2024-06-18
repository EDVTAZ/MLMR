import { Dispatch, SetStateAction } from 'react';
import { FileContent } from 'use-file-picker/types';
import { getRegexComparer } from '../util/filename-compare';

export function PageOrdering({
  type,
  files,
  reorder,
  setReorder,
}: {
  type: string;
  files: FileContent<ArrayBuffer>[];
  reorder: false | string;
  setReorder: Dispatch<SetStateAction<false | string>>;
}) {
  const orderedFiles = files.map((e) => e.name);
  if (reorder !== false) {
    orderedFiles.sort(getRegexComparer(reorder));
  }

  return (
    <details>
      <summary>
        {type} file ordering: {reorder ? reorder.toString() : 'original'}
      </summary>
      <input
        list="prepared-regexes"
        placeholder="original"
        onChange={(e) => {
          const val = (e.target as HTMLInputElement).value;
          setReorder(val.length > 0 && val !== 'original' ? val : false);
        }}
      />
      <datalist id="prepared-regexes">
        <option value="original" />
        <option value="^(?<int0>[0-9]+)\.\w+$" label="numbered" />
        <option value="^(?<string0>.*)\.\w+$" label="string" />
      </datalist>
      <ul>
        {orderedFiles.map((fileName) => (
          <li key={fileName}>{fileName}</li>
        ))}
      </ul>
    </details>
  );
}
