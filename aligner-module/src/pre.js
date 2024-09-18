/* global FS, IDBFS, Module, WorkerGlobalScope */

const mountpointBase = '/idbfs';
const imageDirs = ['in_transl', 'out_transl', 'in_orig', 'out_orig'];
const INDEX_BASE = 1000000;
const SEARCH_RANGE = 10; // TODO get as config option - warning: this should be the same as the constant in main.cpp
let FSsyncInProgress = false;
let FSmounted = false;
let progress = false;

async function syncFromIDB() {
  await syncIDB('from');
}
async function syncToIDB() {
  await syncIDB('to');
}

async function syncIDB(direction) {
  return new Promise((resolve, reject) => {
    if (FS && typeof FS.syncfs == 'function') {
      if (!FSsyncInProgress) {
        FSsyncInProgress = true;
        FS.syncfs(direction === 'from', (err) => {
          FSsyncInProgress = false;
          console.log(
            `Syncing ${direction} IDB to memory FS done, errors: ${err}`
          );
          if (!err) {
            resolve();
          } else {
            reject();
          }
        });
      } else {
        console.log(`FS sync already in progress!`);
        reject();
      }
    } else {
      console.log(`syncIDB: FS.syncfs is not available!`);
      reject();
    }
  });
}

async function mountFS(mountpoint) {
  if (FS && typeof FS.syncfs == 'function' && !FSmounted) {
    FSmounted = true;
    const absmp = `${mountpointBase}/${mountpoint}`;
    const mpStatus = FS.analyzePath(absmp);
    if (!mpStatus.parentExists) {
      FS.mkdir(mountpointBase);
    }
    if (!mpStatus.exists) {
      FS.mkdir(absmp);
    }
    FS.mount(IDBFS, null, absmp);
    FSmounted = absmp;
    await syncFromIDB();
    for (const dir of imageDirs) {
      const dirToCheck = `${absmp}/${dir}`;
      if (!FS.analyzePath(dirToCheck).exists) {
        FS.mkdir(dirToCheck);
      }
    }
    await syncToIDB();
  } else {
    console.log(
      'mountFS: FS.syncFS is not available or there is already something mounted!'
    );
  }
}

async function loadImageWithCanvas(file) {
  const bitmap = await createImageBitmap(
    new Blob([file.content], { type: 'image/*' })
  );
  const width = bitmap.width;
  const height = bitmap.height;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  const imgData = ctx.getImageData(0, 0, width, height);
  FS.writeFile(`/rawdata`, imgData.data);

  return { width, height };
}

async function writeImages(type, images, reindex = true) {
  if (!FSmounted) {
    console.log('Not mounted yet!');
    throw new Error('Not mounted yet!');
  } else {
    for (let index = 0; index < images.length; ++index) {
      const file = images[index];
      if (reindex) {
        file.name = `${index + INDEX_BASE}.${file.name.split('.').at(-1)}`;
      }
      FS.writeFile(
        `${FSmounted}/${type}/${file.name}`,
        new Uint8Array(file.content)
      );
    }
    await syncToIDB();
  }
}

function getUpdatedIndexes(dir, time) {
  const files = FS.readdir(dir).filter((e) => e !== '.' && e !== '..');
  const newFiles = files.filter((path) => {
    return FS.stat(`${dir}/${path}`).mtime > time;
  });
  return new Set(
    Array.from(newFiles, (v) => parseInt(v.slice(0, -4)) - (INDEX_BASE + 1))
  );
}

async function rmdirWithFiles(dir) {
  const files = FS.readdir(dir).filter((e) => e !== '.' && e !== '..');
  for (const file of files) {
    FS.unlink(`${dir}/${file}`);
  }
  FS.rmdir(dir);
  await syncToIDB();
}

async function singleAlignment(type, name, imgs, settings, in_idx, out_idx) {
  const startTime = new Date();
  const { width, height } = await loadImageWithCanvas(imgs[in_idx]);
  const alignArgs = [
    `${FSmounted}/out_${type}/`,
    width,
    height,
    settings['resize'],
    settings['do_split'],
    settings['do_crop'],
    settings['right2left'],
  ];
  if (type === 'transl') {
    alignArgs.push(settings['orb_count']);
  }
  Module[`add_${type}`](...alignArgs);
  await syncToIDB();
  const newIndexes = getUpdatedIndexes(`${FSmounted}/out_${type}`, startTime);
  postMessage({
    msg: `${type}-written`,
    collectionName: name,
    count: (FS.readdir(`${FSmounted}/out_${type}`).length - 2) / 2,
    progressIndex: in_idx + 1,
    progressMax: imgs.length,
    newIndexes,
  });
  console.log(`Processed ${type} image no.${in_idx}`);
  in_idx += 1;
  out_idx = Math.max(out_idx, ...newIndexes);
  return [in_idx, out_idx];
}

async function runAlignment(
  name,
  orig_imgs,
  orig_settings,
  transl_imgs,
  transl_settings
) {
  if (progress !== false) {
    console.log('Alignment already in progress, cannot start new!');
  }

  progress = true;
  console.log('Starting alignment with...');

  console.log('Cleaning up');
  Module['clean']();

  console.log('Saving source images');
  await mountFS(name);
  await writeImages('in_orig', orig_imgs);
  await writeImages('in_transl', transl_imgs);

  console.log('Processing images!');
  let in_orig_idx = 0;
  let in_transl_idx = 0;
  let out_orig_idx = 0;
  let out_transl_idx = 0;
  while (in_orig_idx < orig_imgs.length || in_transl_idx < transl_imgs.length) {
    if (
      (out_transl_idx + SEARCH_RANGE > out_orig_idx ||
        in_transl_idx >= transl_imgs.length) &&
      in_orig_idx < orig_imgs.length
    ) {
      console.log('Adding original');
      [in_orig_idx, out_orig_idx] = await singleAlignment(
        'orig',
        name,
        orig_imgs,
        orig_settings,
        in_orig_idx,
        out_orig_idx
      );
    } else if (in_transl_idx < transl_imgs.length) {
      console.log('Adding transl');
      [in_transl_idx, out_transl_idx] = await singleAlignment(
        'transl',
        name,
        transl_imgs,
        transl_settings,
        in_transl_idx,
        out_transl_idx
      );
    } else {
      console.log('Error in alignment!');
      break;
    }
  }
  console.log('Alignment done!');

  await rmdirWithFiles(`${FSmounted}/in_orig`);
  await rmdirWithFiles(`${FSmounted}/in_transl`);

  FS.unmount(FSmounted);
  FSmounted = false;

  console.log('IDB FS unmounted!');

  progress = false;
  postMessage({
    msg: 'done',
  });
}

async function runImport(name, orig_imgs, transl_imgs) {
  if (progress !== false) {
    console.log('Alignment already in progress, cannot start new!');
  }

  progress = true;
  console.log('Starting alignment with...');

  console.log('Saving images');
  await mountFS(name);
  await writeImages('out_orig', orig_imgs, false);
  await writeImages('out_transl', transl_imgs, false);

  console.log('Import done!');

  FS.unmount(FSmounted);
  FSmounted = false;

  console.log('IDB FS unmounted!');

  progress = false;
  postMessage({
    msg: 'done',
  });
}

if (
  typeof WorkerGlobalScope != 'undefined' &&
  // eslint-disable-next-line no-restricted-globals
  self instanceof WorkerGlobalScope
) {
  Module['onRuntimeInitialized'] = function () {
    console.log('Aligner module loaded!');
    postMessage({ msg: 'loaded', progress });
  };
  onmessage = async ({ data: msg }) => {
    console.log(`Aligner module received message: ${msg}`);
    switch (msg['cmd']) {
      case 'exit':
        Module['_exit']();
        break;
      case 'start':
        runAlignment(
          msg['name'],
          msg['orig_imgs'],
          msg['orig_settings'],
          msg['transl_imgs'],
          msg['transl_settings']
        );
        break;
      case 'direct-import':
        runImport(msg['name'], msg['orig_imgs'], msg['transl_imgs']);
        break;
      default:
        console.log('Unkown command for aligner module!');
        break;
    }
  };
} else {
  console.error('Aligner module started in non-worker environment!');
}
