/* eslint-disable @next/next/no-img-element */
import { storeCollection } from "@/storage";
import { FullWidthButton } from "@/styled-components/Buttons";
import { ColumnLayout } from "@/styled-components/ColumnLayout";
import { BoxContainer } from "@/styled-components/Container";
import { ImagePreview } from "@/styled-components/ImagePreview";
import { StyledNameInput } from "@/styled-components/NameInput";
import { RowLayout } from "@/styled-components/RowLayout";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { useFilePicker } from "use-file-picker";

const ROWSIZE = 4;
const ROWCOUNT = 3;

function Upload({ ...rest }) {
  const [blobURLs, setBlobURLs] = useState<string[]>([]);
  // TODO handle loading state and errors
  const { openFilePicker, filesContent, loading, errors } = useFilePicker({
    readAs: "ArrayBuffer",
    accept: "image/*",
    multiple: true,
  });

  function handleSetBlobURLs(newURLs: string[]) {
    setBlobURLs((prev) => {
      prev.forEach((e) => URL.revokeObjectURL(e));
      return newURLs;
    });
  }

  useEffect(() => {
    const urls = filesContent.slice(0, ROWSIZE * ROWCOUNT).map((fc) => {
      const imageBlob = new Blob([fc.content], { type: "image/*" });
      return URL.createObjectURL(imageBlob);
    });

    handleSetBlobURLs(urls);
    return () => {
      handleSetBlobURLs([]);
    };
  }, [filesContent]);

  return (
    <RowLayout
      $height="100vh"
      $proportions={`5em ${"minmax(0,1fr) ".repeat(ROWCOUNT)}`}
      {...rest}
    >
      <ColumnLayout>
        <FullWidthButton onClick={openFilePicker}>
          Import images
        </FullWidthButton>
        {filesContent.length > 0 && (
          <>
            <BoxContainer>{`Loaded ${filesContent.length} images!`}</BoxContainer>
            <StyledNameInput
              buttonText="Save"
              labelText="Collection Name:"
              handleSave={(collectionName) =>
                storeCollection(collectionName, filesContent)
              }
            />
          </>
        )}
      </ColumnLayout>

      {[...Array(ROWCOUNT).keys()].map((i) => {
        return (
          <ColumnLayout key={i}>
            {blobURLs
              .slice(i * ROWSIZE, (i + 1) * ROWSIZE)
              .map((url, index) => (
                <ImagePreview src={url} key={index} alt="Preview" />
              ))}
          </ColumnLayout>
        );
      })}
    </RowLayout>
  );
}

export const StyledUpload = styled(Upload)``;
