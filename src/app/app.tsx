import { CreateCollection } from './CreateCollection';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ReadCollection, readCollectionLoader } from './ReadCollection';
import { MainMenu } from './MainMenu';
import { WorkerProvider } from './AlignerWorker';
import { DimBrightness } from './DimBrightness';
import { DropBoxSyncPage } from './DropBoxSync';

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
  {
    path: 'sync',
    element: <DropBoxSyncPage />,
  },
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
