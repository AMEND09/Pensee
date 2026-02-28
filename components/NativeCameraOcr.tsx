import React from 'react';

type Props = {
  visible: boolean;
  onClose: () => void;
  onTextRecognized: (text: string) => void;
};

// Web stub – native camera OCR is not available on web.
export default function NativeCameraOcr(_props: Props) {
  return null;
}
