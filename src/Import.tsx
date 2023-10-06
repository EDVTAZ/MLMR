import { useFilePicker } from "use-file-picker";
import styled from "styled-components";
import { useState } from "react";
import { FileContent } from "use-file-picker/dist/interfaces";

function Import({ ...rest }) {
  const [selected, setSelected] = useState({ name: "", blobURL: "" });
  const { openFilePicker, filesContent, loading, errors } = useFilePicker({
    readAs: "ArrayBuffer",
    accept: "image/*",
    multiple: true,
  });

  function selectImage(file: FileContent<ArrayBuffer>) {
    // if (selected.blobURL) URL.revokeObjectURL(selected.blobURL); this is not safe to do here I think, leave this for later...
    const imageBlob = new Blob([file.content], { type: "image/*" });
    setSelected({
      name: file.name,
      blobURL: URL.createObjectURL(imageBlob),
    });
  }

  return (
    <div {...rest}>
      <h1 onClick={openFilePicker}>Import images</h1>
      <div className="table-div">
        <table>
          <tbody>
            {filesContent.map((fileContent) => {
              return (
                <tr
                  key={fileContent.name}
                  onClick={() => selectImage(fileContent)}
                >
                  <td
                    className={
                      selected.name === fileContent.name
                        ? "selected"
                        : "not-selected"
                    }
                  >
                    {fileContent.name}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <img
        src={selected.blobURL}
        alt="Preview"
        style={{ opacity: selected.blobURL === "" ? 0 : 1 }}
      />
    </div>
  );
}

export default styled(Import)`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;

  width: 100%;
  height: 100%;

  h1 {
    width: 100%;
    text-align: center;
  }

  .table-div {
    border: 1px solid;
    overflow-y: auto;
    width: 80%;
    height: 40%;
    display: block;
  }

  table {
    width: 100%;
  }

  td {
    border: 1px solid;
    height: 0;
    width: 100%;
  }

  .selected {
    background-color: #666666;
    color: #f0f0f0;
    border-color: #000000;
  }

  img {
    border: 1px solid;
    width: 80%;
    height: 40%;
    object-fit: contain;
  }
`;
