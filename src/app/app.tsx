import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { WorkerProvider } from './aligner-worker/AlignerWorker';
import { DimBrightness } from './DimBrightness';
import { CreateCollection } from './import/CreateCollection';
import { MainMenu } from './MainMenu';
import { ReadCollection, readCollectionLoader } from './read/ReadCollection';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainMenu />,
  },
  {
    path: 'index.html',
    element: <MainMenu />,
  },
  {
    path: 'import',
    element: <CreateCollection />,
  },
  // {
  //   path: 'sync',
  //   element: <DropBoxSyncPage />,
  // },
  {
    path: 'read/:collectionName',
    element: <ReadCollection />,
    loader: readCollectionLoader,
  },
]);

export function App() {
  return (
    <>
      <WorkerProvider>
        <RouterProvider router={router} />
      </WorkerProvider>
      <DimBrightness />
    </>
  );
}

export default App;
