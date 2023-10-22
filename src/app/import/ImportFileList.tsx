import styled from "styled-components";
import { FileContent } from "use-file-picker/types";

type FileListProp = {
  filesContent: FileContent<ArrayBuffer>[];
  selectedPreview: { name: string; blobURL: string };
  selectImage: (file: FileContent<ArrayBuffer>) => void;
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
                key={fileContent.name}
                onClick={() => selectImage(fileContent)}
              >
                <td
                  className={
                    selectedPreview.name === fileContent.name ? "selected" : ""
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
  );
}

export const StyledFileList = styled(FileList)`
  border: 1px solid;
  overflow-y: auto;
  width: 90%;
  height: 45%;
  display: block;

  table {
    width: 100%;
    border-spacing: 0;
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
`;
