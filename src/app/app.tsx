import { CreateCollection } from './CreateCollection';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ReadCollection, readCollectionLoader } from './ReadCollection';
import { MainMenu } from './MainMenu';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainMenu />,
  },
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
