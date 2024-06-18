import { ImportImagesProps } from './types';

export function UploadImages({
  typeName,
  openFilePicker,
  settings,
  setSettings,
  idBase,
  disabled,
}: ImportImagesProps) {
  return (
    <div>
      <button
        id={`upload-images-${idBase}`}
        onClick={openFilePicker}
        disabled={disabled}
      >
        Import {typeName}
      </button>
      <label htmlFor={`resize-to-${idBase}`}>{' | Resize:'}</label>
      <input
        id={`resize-to-${idBase}`}
        name="resizeTo"
        type="number"
        value={settings.resize}
        onInput={(e) =>
          setSettings((prev) => {
            return {
              ...prev,
              resize: parseInt((e.target as HTMLInputElement).value),
            };
          })
        }
        disabled={disabled}
      />
      <input
        id={`do-crop-${idBase}`}
        name="doCrop"
        type="checkbox"
        checked={settings.do_crop}
        onChange={(e) =>
          setSettings((prev) => {
            return {
              ...prev,
              do_crop: e.target.checked,
            };
          })
        }
        disabled={disabled}
      />
      <label htmlFor={`do-crop-${idBase}`}>{'Crop pages]'}</label>
      <input
        id={`do-split-${idBase}`}
        name="doSplit"
        type="checkbox"
        checked={settings.do_split}
        onChange={(e) =>
          setSettings((prev) => {
            return {
              ...prev,
              do_split: e.target.checked,
            };
          })
        }
        disabled={disabled}
      />
      <label htmlFor={`do-split-${idBase}`}>{'Split double pages]'}</label>
      <input
        id={`right-to-left-${idBase}`}
        name="rightToLeft"
        type="checkbox"
        checked={settings.right2left}
        onChange={(e) =>
          setSettings((prev) => {
            return {
              ...prev,
              right2left: e.target.checked,
            };
          })
        }
        disabled={disabled}
      />
      <label htmlFor={`right-to-left-${idBase}`}>
        {'Right to left if checked]'}
      </label>
    </div>
  );
}
