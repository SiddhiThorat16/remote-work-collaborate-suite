import React from "react";
import { useParams } from "react-router-dom";
import CollaborativeEditor from "../components/CollaborativeEditor";

const DocumentEditor = () => {
  const { docName } = useParams(); // get docName from URL
  return <CollaborativeEditor docName={docName || "default-doc"} />;
};

export default DocumentEditor;
