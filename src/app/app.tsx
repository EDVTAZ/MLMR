import { CreateCollection } from './CreateCollection';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ReadCollection, readCollectionLoader } from './ReadCollection';
import { MainMenu } from './MainMenu';
import { WorkerProvider } from './AlignerWorker';
import { DimBrightness } from './DimBrightness';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';

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
    path: 'read/:collectionName',
    element: <ReadCollection />,
    loader: readCollectionLoader,
  },
]);

const authConfig: AuthProviderProps = {
  authority: 'https://www.dropbox.com',
  client_id: '5uv84280kefln5c',
  redirect_uri: 'http://localhost:4200/',
  onSigninCallback: () => {
    window.history.pushState({}, '', 'http://localhost:4200/');
  },
  scope:
    'account_info.read files.metadata.read files.metadata.write files.content.read files.content.write',
};

export function App() {
  return (
    <>
      <AuthProvider {...authConfig}>
        <WorkerProvider>
          <RouterProvider router={router} />
        </WorkerProvider>
      </AuthProvider>
      <DimBrightness />
    </>
  );
}

export default App;
