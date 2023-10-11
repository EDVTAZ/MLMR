import "./App.css";
import { StyledImport } from "./Import";
import { StyledReader } from "./Reader";

function App() {
  if (window.location.hash === "#import") return <StyledImport></StyledImport>;
  if (window.location.hash.startsWith("#read/"))
    return (
      <StyledReader
        collectionNames={window.location.hash.slice(6).split(";")}
      />
    );

  return <div>Root</div>;
}

export default App;
