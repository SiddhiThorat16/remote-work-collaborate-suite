import WorkspaceCard from './WorkspaceCard';

const QuickAccessWorkspaces = ({ workspaces = [] }) => (
  <div className="flex flex-row gap-4">
    {workspaces.map(ws => (
      <WorkspaceCard key={ws.id} workspace={ws} />
    ))}
  </div>
);

export default QuickAccessWorkspaces;
