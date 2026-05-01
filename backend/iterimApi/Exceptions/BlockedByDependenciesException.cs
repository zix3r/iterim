using iterimApi.DTOs.WorkItems;

namespace iterimApi.Exceptions;

public class BlockedByDependenciesException : Exception
{
    public List<WorkItemDependencyDto> Blockers { get; }

    public BlockedByDependenciesException(List<WorkItemDependencyDto> blockers)
        : base("Cannot move to In Progress: unfinished blockers exist")
    {
        Blockers = blockers;
    }
}
