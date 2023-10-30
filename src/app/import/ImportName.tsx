import { FormEvent, useState } from "react";
import styled from "styled-components";

function NameInput({
  storeCollection,
  ...rest
}: {
  storeCollection: (collectionName: string) => void;
}) {
  const [collectionName, setCollectionName] = useState("");

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    storeCollection(collectionName);
  }

  return (
    <div {...rest}>
      <label htmlFor="collection-name">Collection Name:</label>
      <form onSubmit={handleSubmit}>
        <input
          id="collection-name"
          name="collectionName"
          onInput={(e) =>
            setCollectionName((e.target as HTMLInputElement).value)
          }
        />
        <button type="submit">Save images</button>
      </form>
    </div>
  );
}

export const StyledNameInput = styled(NameInput)`
  border: 1px solid;
  padding: 0.5em;
  margin: 1em 0 0 0;

  form {
    display: flex;
    align-items: center;
    input {
      margin: 0 0.5em 0 0;
      border: 1px solid;
      width: 100%;
      min-width: 0;
    }
    button {
      border: 1px solid;
      background: #bbbbbb;
      white-space: nowrap;
    }
  }
`;
