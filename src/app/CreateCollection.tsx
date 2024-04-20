import { useContext, useEffect, useState } from 'react';
import { useFilePicker } from 'use-file-picker';
import { FileContent } from 'use-file-picker/types';
import { WorkerContext } from './AlignerWorker';
import { Link, useNavigate } from 'react-router-dom';

export function CreateCollection({ ...rest }) {
  const [collectionName, setCollectionName] = useState<string>('');
  // TODO handle loading state and errors
  const { openFilePicker, filesContent } = useFilePicker({
    readAs: 'ArrayBuffer',
    accept: 'image/*',
    multiple: true,
  });
  const { openFilePicker: openFilePicker2, filesContent: filesContent2 } =
    useFilePicker({
      readAs: 'ArrayBuffer',
      accept: 'image/*',
      multiple: true,
    });
  const { worker, setNeeded } = useContext(WorkerContext);
  const navigate = useNavigate();

  useEffect(() => {
    setNeeded(true);
  }, []);

  useEffect(() => {
    if (!worker) return;

    function messageHandler({ data }: MessageEvent) {
      if (data['msg'] === 'orig-written') {
        localStorage[`${collectionName}-orig`] = data['count'];
        navigate(`/read/${collectionName}`);
      }
      if (data['msg'] === 'transl-written') {
        localStorage[`${collectionName}-transl`] = data['count'];
      }
    }

    worker.addEventListener('message', messageHandler);
    return () => {
      worker.removeEventListener('message', messageHandler);
    };
  }, [worker, collectionName]);

  function startAlignment(
    dirname: string,
    filesContent: FileContent<ArrayBuffer>[],
    filesContent2: FileContent<ArrayBuffer>[]
  ) {
    if (!worker) return;
    worker.postMessage(
      {
        cmd: 'start',
        name: dirname,
        orig_imgs: filesContent,
        orig_settings: {
          resize: 2000000,
          do_split: true,
          do_crop: true,
          right2left: true,
        },
        transl_imgs: filesContent2,
        transl_settings: {
          resize: 2000000,
          do_split: true,
          do_crop: true,
          right2left: true,
        },
      },
      filesContent
        .map((file) => {
          return file.content;
        })
        .concat(
          filesContent2.map((file) => {
            return file.content;
          })
        )
    );
  }

  return (
    <>
      <button onClick={openFilePicker}>Import images</button>
      <button onClick={openFilePicker2}>Import images2</button>
      {filesContent.length > 0 && filesContent2.length > 0 && (
        <>
          <div>{`Loaded ${filesContent.length}+${filesContent2.length} images!`}</div>
          <label htmlFor="collection-name">{'Collection Name:'}</label>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              startAlignment(collectionName, filesContent, filesContent2);
            }}
          >
            <input
              id="collection-name"
              name="collectionName"
              onInput={(e) =>
                setCollectionName((e.target as HTMLInputElement).value)
              }
            />
            <button>{'Start'}</button>
          </form>
        </>
      )}
      <Link to={'/'}>
        <button>Back to home</button>
      </Link>
    </>
  );
}
