import { DBImage } from "@/types";
import styled from "styled-components";

type FileListProp = {
  filesContent: DBImage[];
  selectedPreview: { name: string; blobURL: string };
  selectImage: (file: DBImage) => void;
};

function FileList({
  filesContent,
  selectedPreview,
  selectImage,
  ...rest
}: FileListProp) {
  return (
    <div {...rest}>
      <table>
        <tbody>
          {filesContent.map((fileContent) => {
            return (
              <tr
                key={fileContent.filename}
                onClick={() => selectImage(fileContent)}
              >
                <td
                  className={
                    selectedPreview.name === fileContent.filename
                      ? "selected"
                      : ""
                  }
                >
                  {fileContent.filename}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const StyledFileList = styled(FileList)`
  border: 1px solid;
  overflow-y: auto;
  height: 100%;
  width: 100%;

  box-sizing: border-box;
  display: block;

  table {
    width: 100%;
    border-spacing: 0;
  }

  td {
    border-bottom: 1px solid;
    height: 0;
    width: 100%;
  }

  .selected {
    background-color: #666666;
    color: #f0f0f0;
    border-color: #000000;
  }
`;
