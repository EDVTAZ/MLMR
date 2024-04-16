import { CreateCollection } from './CreateCollection';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ReadCollection, readCollectionLoader } from './ReadCollection';

const router = createBrowserRouter([
  {
    path: 'import',
    element: <CreateCollection />,
  },
  {
    path: 'read/:collectionName',
    element: <ReadCollection />,
    loader: readCollectionLoader,
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

export default App;
