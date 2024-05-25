/* global FS, IDBFS, Module, WorkerGlobalScope */

const mountpointBase = '/idbfs';
const imageDirs = ['in_transl', 'out_transl', 'in_orig', 'out_orig'];
const INDEX_BASE = 1000000;
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

async function writeImages(type, images, reindex = true) {
  if (!FSmounted) {
    console.log('Not mounted yet!');
    throw new Error('Not mounted yet!');
  } else {
    images.forEach((file, index) => {
      let filename = file.name;
      if (reindex) {
        filename = `${index + INDEX_BASE}.${file.name.split('.').at(-1)}`;
      }
      FS.writeFile(
        `${FSmounted}/${type}/${filename}`,
        new Uint8Array(file.content)
      );
    });
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

  console.log('Processing orig images');
  for (let i = 0; i < orig_imgs.length; ++i) {
    const startTime = new Date();
    Module['add_orig'](
      `${FSmounted}/in_orig/${i + INDEX_BASE}.${orig_imgs[i].name
        .split('.')
        .at(-1)}`,
      `${FSmounted}/out_orig/`,
      orig_settings['resize'],
      orig_settings['do_split'],
      orig_settings['do_crop'],
      orig_settings['right2left']
    );
    await syncToIDB();
    postMessage({
      msg: 'orig-written',
      collectionName: name,
      count: (FS.readdir(`${FSmounted}/out_orig`).length - 2) / 2,
      progressIndex: i + 1,
      progressMax: orig_imgs.length,
      newIndexes: getUpdatedIndexes(`${FSmounted}/out_orig`, startTime),
    });
    console.log(`Processed orig image no.${i}`);
  }

  console.log('Processing transl images');
  for (let i = 0; i < transl_imgs.length; ++i) {
    const startTime = new Date();
    Module['add_transl'](
      `${FSmounted}/in_transl/${i + INDEX_BASE}.${transl_imgs[i].name
        .split('.')
        .at(-1)}`,
      `${FSmounted}/out_transl/`,
      transl_settings['resize'],
      transl_settings['do_split'],
      transl_settings['do_crop'],
      transl_settings['right2left'],
      transl_settings['orb_count']
    );
    await syncToIDB();
    postMessage({
      msg: 'transl-written',
      collectionName: name,
      count: (FS.readdir(`${FSmounted}/out_transl`).length - 2) / 2,
      progressIndex: i + 1,
      progressMax: transl_imgs.length,
      newIndexes: getUpdatedIndexes(`${FSmounted}/out_transl`, startTime),
    });
    console.log(`Processed transl image no.${i}`);
  }

  console.log('Alignment done!');

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
