import React from "react";
import "./App.css";
import { isErr, Document } from "earthstar";
import {
  EarthstarPeer,
  Earthbar,
  MultiWorkspaceTab,
  AuthorTab,
  Spacer,
  useWorkspaces,
  useDocument,
  useCurrentAuthor,
  WorkspaceLabel,
  useDocuments,
  AuthorLabel,
} from "react-earthstar";
import { formatDistance } from "date-fns";
import "react-earthstar/styles/layout.css";

function App() {
  return (
    <div className="App">
      <EarthstarPeer>
        <Earthbar>
          <MultiWorkspaceTab />
          <Spacer />
          <AuthorTab />
        </Earthbar>
        <StatusPoster />
        <StatusesList />
      </EarthstarPeer>
    </div>
  );
}

// Cinnamon
// - +gardening
//   - my basil is flowering!
// - +earthstardev
//   - I just wrote some great docs

function StatusPoster() {
  const workspaces = useWorkspaces();

  const [newStatus, setNewStatus] = React.useState("");
  const [selectedWorkspace, setSelectedWorkspace] = React.useState(
    workspaces.length > 0 ? workspaces[0] : null
  );
  const [currentAuthor] = useCurrentAuthor();

  const [, setStatusDoc] = useDocument(
    `/about/~${currentAuthor?.address}/status.txt`,
    selectedWorkspace || "oops"
  );

  return (
    <div>
      {currentAuthor === null ? "Sign in to post!" : null}
      {workspaces.length > 0 && currentAuthor?.address ? (
        <form
          id={"message-poster"}
          onSubmit={(e) => {
            e.preventDefault();

            const result = setStatusDoc(newStatus);

            if (isErr(result)) {
              alert("Something went wrong!");
              return;
            }

            setNewStatus("");
          }}
        >
          <select
            value={selectedWorkspace || "NOTHING"}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
          >
            <option disabled value={"NOTHING"}>
              {"Pick a workspace"}
            </option>
            {workspaces.map((address) => (
              <option value={address}>{address}</option>
            ))}
          </select>
          <textarea
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />
          <button type="submit">{"Update status"}</button>
        </form>
      ) : (
        "Add some workspaces so that you can post!"
      )}
    </div>
  );
}

function StatusesList() {
  const workspaces = useWorkspaces();

  return (
    <>
      {workspaces.map((address) => (
        <WorkspaceStatuses key={address} address={address} />
      ))}
    </>
  );
}

type WorkspaceStatusesProps = {
  address: string;
};

function WorkspaceStatuses({
  address: workspaceAddress,
}: WorkspaceStatusesProps) {
  const docs = useDocuments(
    { pathPrefix: "/about/" },
    workspaceAddress
  ).filter((doc) => doc.path.endsWith("/status.txt"));

  return (
    <>
      <hr />
      <div>
        <h2>
          <WorkspaceLabel address={workspaceAddress} />
        </h2>
        <ul>
          {docs.map((doc) => (
            <Status key={doc.path} doc={doc} />
          ))}
        </ul>
      </div>
    </>
  );
}

type StatusProps = {
  doc: Document;
};

function Status({ doc }: StatusProps) {
  const date = new Date(doc.timestamp / 1000);
  const agoString = formatDistance(date, new Date(), {
    addSuffix: true,
  });

  const oldness = howOld(date);

  // TODO: Actually make different styles for the different oldnesses

  const [displayNameDoc] = useDocument(
    `/about/~${doc.author}/displayName.txt`,
    doc.workspace
  );

  return (
    <li className={["status", oldness].join(" ")}>
      <p>
        <strong>
          {displayNameDoc ? (
            displayNameDoc.content
          ) : (
            <AuthorLabel address={doc.author} />
          )}
        </strong>{" "}
        {doc.content}
      </p>
      <p>{agoString}</p>
    </li>
  );
}

type Oldness = "recent" | "old" | "ancient";

function howOld(date: Date): Oldness {
  const daysOld = (Date.now() - date.getTime()) / 1000 / 60 / 60 / 24;

  if (daysOld > 365) {
    return "ancient";
  }

  if (daysOld > 30) {
    return "old";
  }

  return "recent";
}

export default App;
