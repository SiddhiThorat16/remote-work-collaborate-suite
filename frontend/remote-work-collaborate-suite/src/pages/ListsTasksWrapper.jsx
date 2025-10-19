import { useLocation } from "react-router-dom";
import ListsTasksPage from "./ListsTasksPage";

export default function ListsTasksWrapper() {
  const location = useLocation();
  const workspaceId = location.state?.workspaceId;

  return <ListsTasksPage currentWorkspaceId={workspaceId} />;
}
