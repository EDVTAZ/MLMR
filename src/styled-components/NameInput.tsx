import { FullWidthButton } from "@/styled-components/Buttons";
import { BoxContainer } from "@/styled-components/Container";
import { FormEvent, useState } from "react";
import styled from "styled-components";

function NameInput({
  handleSave,
  buttonText,
  labelText,
  ...rest
}: {
  handleSave: (collectionName: string) => void;
  buttonText: string;
  labelText: string;
}) {
  const [collectionName, setCollectionName] = useState("");

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    handleSave(collectionName);
  }

  return (
    <BoxContainer $textAlign="start" {...rest}>
      <label htmlFor="collection-name">{labelText}</label>
      <form onSubmit={handleSubmit}>
        <input
          id="collection-name"
          name="collectionName"
          onInput={(e) =>
            setCollectionName((e.target as HTMLInputElement).value)
          }
        />
        <FullWidthButton>{buttonText}</FullWidthButton>
      </form>
    </BoxContainer>
  );
}

export const StyledNameInput = styled(NameInput)`
  form {
    display: flex;
    align-items: center;
    input {
      margin: 0 0.5em 0 0;
      border: 1px solid;
      width: 100%;
      min-width: 0;
    }
  }
`;
