/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
const mountpointBase = '/idbfs';
const imageDirs = ['in_transl', 'out_transl', 'in_orig', 'out_orig'];
const INDEX_BASE = 1000000;
let FSsyncInProgress = false;
let FSmounted = false;

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
    for (dir of imageDirs) {
      dirToCheck = `${absmp}/${dir}`;
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

async function writeImages(type, images) {
  if (!FSmounted) {
    console.log('Not mounted yet!');
    throw new Error('Not mounted yet!');
  } else {
    images.forEach((file, index) => {
      FS.writeFile(
        `${FSmounted}/${type}/${index + INDEX_BASE}.${file.name
          .split('.')
          .at(-1)}`,
        new Uint8Array(file.content)
      );
    });
    await syncToIDB();
  }
}

function getFileIndexes(dir) {
  const files = FS.readdir(dir).filter((e) => e !== '.' && e !== '..');
  return new Set(
    Array.from(files, (v) => parseInt(v.slice(0, -4)) - (INDEX_BASE + 1))
  );
}

async function runAlignment(
  name,
  orig_imgs,
  orig_settings,
  transl_imgs,
  transl_settings
) {
  console.log('Starting alignment with...');

  console.log('Cleaning up');
  Module['clean']();

  console.log('Saving source images');
  await mountFS(name);
  await writeImages('in_orig', orig_imgs);
  await writeImages('in_transl', transl_imgs);

  console.log('Processing orig images');
  for (let i = 0; i < orig_imgs.length; ++i) {
    const old_indexes = getFileIndexes(`${FSmounted}/out_orig`);
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
      newIndexes: getFileIndexes(`${FSmounted}/out_orig`).difference(
        old_indexes
      ),
    });
    console.log(`Processed orig image no.${i}`);
  }

  console.log('Processing transl images');
  for (let i = 0; i < transl_imgs.length; ++i) {
    const old_indexes = getFileIndexes(`${FSmounted}/out_transl`);
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
      newIndexes: getFileIndexes(`${FSmounted}/out_transl`).difference(
        old_indexes
      ),
    });
    console.log(`Processed transl image no.${i}`);
  }

  console.log('Alignment done!');

  FS.unmount(FSmounted);
  FSmounted = false;

  console.log('IDB FS unmounted!');

  postMessage({
    msg: 'done',
  });
}

if (
  typeof WorkerGlobalScope != 'undefined' &&
  self instanceof WorkerGlobalScope
) {
  Module['onRuntimeInitialized'] = function () {
    console.log('Aligner module loded!');
    postMessage('loaded');
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
      default:
        console.log('Unkown command for aligner module!');
        break;
    }
  };
} else {
  console.error('Aligner module started in non-worker environment!');
}
