import { getFileDataFromIDB, getFileName } from './storage';

async function dropBoxPost(url: string, body: string, accessToken: string) {
  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: body,
  });
}

export async function createFolderDropBox(path: string, accessToken: string) {
  await dropBoxPost(
    'https://api.dropboxapi.com/2/files/create_folder_v2',
    JSON.stringify({ path: path }),
    accessToken
  );
}

export async function deleteDropBox(path: string, accessToken: string) {
  await dropBoxPost(
    'https://api.dropboxapi.com/2/files/delete_v2',
    JSON.stringify({ path: path }),
    accessToken
  );
}

export async function listFolderDropBox(path: string, accessToken: string) {
  let result: string[] = [];
  let response = await dropBoxPost(
    'https://api.dropboxapi.com/2/files/list_folder',
    JSON.stringify({ path: path }),
    accessToken
  );

  if (response.status !== 200) return result;
  let responseData = await response.json();
  result = result.concat(responseData['entries']);

  while (responseData['has_more']) {
    response = await dropBoxPost(
      'https://api.dropboxapi.com/2/files/list_folder/continue',
      JSON.stringify({ cursor: responseData['cursor'] }),
      accessToken
    );
    responseData = await response.json();
    result = result.concat(responseData['entries']);
  }

  return result;
}

export async function uploadSingleDropBox(
  path: string,
  data: ArrayBuffer,
  accessToken: string
) {
  try {
    const result = await fetch(
      'https://content.dropboxapi.com/2/files/upload',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({ path }),
        },
        method: 'POST',
        body: data,
      }
    );
    if (result.status === 200) return;
  } catch (e) {
    console.log(e);
  }
  // TODO proper error handling and retry
  setTimeout(() => {
    uploadSingleDropBox(path, data, accessToken);
  }, Math.random() * 900 + 100);
}

export async function uploadFolderDropBox(
  collectionName: string,
  type: 'orig' | 'transl',
  accessToken: string
) {
  const pageCount = parseInt(localStorage[`${collectionName}-orig`]);
  for (let index = 0; index < pageCount; index++) {
    getFileDataFromIDB(
      `/idbfs/${collectionName}`,
      `out_${type}/${getFileName(index)}`,
      (imageData) => {
        uploadSingleDropBox(
          `/${collectionName}/${type}/${getFileName(index)}`,
          imageData,
          accessToken
        );
      }
    );
  }
}
