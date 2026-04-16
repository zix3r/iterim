using System.Net;
using System.Net.Http.Json;
using iterimApi.Data;
using iterimApi.Models.Enums;
using iterimApi.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Tests;

public class TeamsIterationsWorkItemsIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public TeamsIterationsWorkItemsIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task StartIteration_WhenAnotherIsActive_ReturnsConflict()
    {
        await _factory.ResetDatabaseAsync();

        var setup = await SeedBasicTeamAsync();
        using var client = _factory.CreateApiClient(setup.AdminId);

        var createIteration1 = await client.PostAsJsonAsync(
            $"/api/teams/{setup.TeamId}/iterations",
            new { name = "Sprint A" });
        var createIteration2 = await client.PostAsJsonAsync(
            $"/api/teams/{setup.TeamId}/iterations",
            new { name = "Sprint B" });

        Assert.Equal(HttpStatusCode.Created, createIteration1.StatusCode);
        Assert.Equal(HttpStatusCode.Created, createIteration2.StatusCode);

        using var iter1Json = await TestJsonHelpers.ReadJsonAsync(createIteration1);
        using var iter2Json = await TestJsonHelpers.ReadJsonAsync(createIteration2);
        var iteration1Id = iter1Json.RootElement.GetProperty("id").GetInt32();
        var iteration2Id = iter2Json.RootElement.GetProperty("id").GetInt32();

        var startFirst = await client.PatchAsync($"/api/iterations/{iteration1Id}/start", JsonContent.Create(new { }));
        Assert.Equal(HttpStatusCode.OK, startFirst.StatusCode);

        var startSecond = await client.PatchAsync($"/api/iterations/{iteration2Id}/start", JsonContent.Create(new { }));
        Assert.Equal(HttpStatusCode.Conflict, startSecond.StatusCode);
    }

    [Fact]
    public async Task WorkItems_Crud_AndAssignToCompletedIteration_ReturnsBadRequest()
    {
        await _factory.ResetDatabaseAsync();

        var setup = await SeedBasicTeamAsync();
        int completedIterationId = 0;

        await _factory.ExecuteDbContextAsync(async db =>
        {
            var team = await db.Teams.FirstAsync(t => t.Id == setup.TeamId);
            var user = await db.Users.FirstAsync(u => u.Id == setup.AdminId);
            var completedIteration = await TestDataSeeder.CreateIterationAsync(db, team, user, "Completed Sprint", IterationStatus.Completed);
            completedIterationId = completedIteration.Id;
        });

        using var client = _factory.CreateApiClient(setup.AdminId);

        var createWorkItem = await client.PostAsJsonAsync(
            $"/api/teams/{setup.TeamId}/workitems",
            new
            {
                title = "Implement API",
                description = "Work item",
                type = "Story",
                priority = "Medium",
                points = 3
            });

        Assert.Equal(HttpStatusCode.Created, createWorkItem.StatusCode);

        using var createJson = await TestJsonHelpers.ReadJsonAsync(createWorkItem);
        var workItemId = createJson.RootElement.GetProperty("id").GetInt32();

        var assignToCompleted = await client.PutAsJsonAsync(
            $"/api/workitems/{workItemId}",
            new
            {
                title = "Implement API",
                description = "Work item",
                type = "Story",
                priority = "Medium",
                points = 3,
                status = "Todo",
                iterationId = completedIterationId
            });

        Assert.Equal(HttpStatusCode.BadRequest, assignToCompleted.StatusCode);

        var updateWorkItem = await client.PutAsJsonAsync(
            $"/api/workitems/{workItemId}",
            new
            {
                title = "Implement API Updated",
                description = "Updated",
                type = "Story",
                priority = "High",
                points = 5,
                status = "InProgress"
            });

        Assert.Equal(HttpStatusCode.OK, updateWorkItem.StatusCode);

        var deleteWorkItem = await client.DeleteAsync($"/api/workitems/{workItemId}");
        Assert.Equal(HttpStatusCode.OK, deleteWorkItem.StatusCode);
    }

    [Fact]
    public async Task DeleteTeam_WhenActiveIterationExists_ReturnsConflict()
    {
        await _factory.ResetDatabaseAsync();

        var setup = await SeedBasicTeamAsync();

        await _factory.ExecuteDbContextAsync(async db =>
        {
            var team = await db.Teams.FirstAsync(t => t.Id == setup.TeamId);
            var user = await db.Users.FirstAsync(u => u.Id == setup.AdminId);
            await TestDataSeeder.CreateIterationAsync(db, team, user, "Active Sprint", IterationStatus.Active);
        });

        using var client = _factory.CreateApiClient(setup.AdminId);

        var response = await client.DeleteAsync($"/api/teams/{setup.TeamId}");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task SprintBoard_FullCycle_BacklogToDoneToComplete()
    {
        await _factory.ResetDatabaseAsync();

        var setup = await SeedBasicTeamAsync();
        using var client = _factory.CreateApiClient(setup.AdminId);

        var createIteration = await client.PostAsJsonAsync(
            $"/api/teams/{setup.TeamId}/iterations",
            new { name = "Sprint Board Flow" });
        Assert.Equal(HttpStatusCode.Created, createIteration.StatusCode);

        using var iterationJson = await TestJsonHelpers.ReadJsonAsync(createIteration);
        var iterationId = iterationJson.RootElement.GetProperty("id").GetInt32();

        var createWorkItem = await client.PostAsJsonAsync(
            $"/api/teams/{setup.TeamId}/workitems",
            new
            {
                title = "Board item",
                description = "Backlog item",
                type = "Story",
                priority = "Medium",
                points = 2
            });
        Assert.Equal(HttpStatusCode.Created, createWorkItem.StatusCode);

        using var workItemJson = await TestJsonHelpers.ReadJsonAsync(createWorkItem);
        var workItemId = workItemJson.RootElement.GetProperty("id").GetInt32();

        var startIteration = await client.PatchAsync($"/api/iterations/{iterationId}/start", JsonContent.Create(new { }));
        Assert.Equal(HttpStatusCode.OK, startIteration.StatusCode);

        var moveToTodo = await client.PutAsJsonAsync(
            $"/api/workitems/{workItemId}",
            new
            {
                title = "Board item",
                description = "Backlog item",
                type = "Story",
                priority = "Medium",
                points = 2,
                status = "Todo",
                iterationId = iterationId
            });
        Assert.Equal(HttpStatusCode.OK, moveToTodo.StatusCode);

        var moveToInProgress = await client.PutAsJsonAsync(
            $"/api/workitems/{workItemId}",
            new
            {
                title = "Board item",
                description = "Backlog item",
                type = "Story",
                priority = "Medium",
                points = 2,
                status = "InProgress",
                iterationId = iterationId
            });
        Assert.Equal(HttpStatusCode.OK, moveToInProgress.StatusCode);

        var moveToDone = await client.PutAsJsonAsync(
            $"/api/workitems/{workItemId}",
            new
            {
                title = "Board item",
                description = "Backlog item",
                type = "Story",
                priority = "Medium",
                points = 2,
                status = "Done",
                iterationId = iterationId
            });
        Assert.Equal(HttpStatusCode.OK, moveToDone.StatusCode);

        var activeBoard = await client.GetAsync($"/api/teams/{setup.TeamId}/boards/active");
        Assert.Equal(HttpStatusCode.OK, activeBoard.StatusCode);

        var completeIteration = await client.PatchAsync($"/api/iterations/{iterationId}/complete", JsonContent.Create(new { }));
        Assert.Equal(HttpStatusCode.OK, completeIteration.StatusCode);

        var boardAfterCompletion = await client.GetAsync($"/api/teams/{setup.TeamId}/boards/active");
        Assert.Equal(HttpStatusCode.NotFound, boardAfterCompletion.StatusCode);
    }

    [Fact]
    public async Task WorkItemValidation_NegativePoints_ReturnsFieldLevelError()
    {
        await _factory.ResetDatabaseAsync();

        var setup = await SeedBasicTeamAsync();
        using var client = _factory.CreateApiClient(setup.AdminId);

        var response = await client.PostAsJsonAsync(
            $"/api/teams/{setup.TeamId}/workitems",
            new
            {
                title = "Invalid points",
                description = "x",
                type = "Bug",
                priority = "Low",
                points = -1
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        using var payload = await TestJsonHelpers.ReadJsonAsync(response);
        Assert.True(payload.RootElement.TryGetProperty("errors", out var errors));
        var hasPointsError = errors
            .EnumerateObject()
            .Any(p => string.Equals(p.Name, "points", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasPointsError);
    }

    private async Task<(int AdminId, int TeamId)> SeedBasicTeamAsync()
    {
        return await _factory.ExecuteDbContextAsync(async db =>
        {
            var admin = await TestDataSeeder.CreateUserAsync(db, $"admin-{Guid.NewGuid():N}@example.com", "Admin User");
            var (org, orgMember) = await TestDataSeeder.CreateOrganizationWithAdminAsync(db, admin, "Core Org");
            var product = await TestDataSeeder.CreateProductAsync(db, org, admin, "Core Product");
            var team = await TestDataSeeder.CreateTeamAsync(db, product, admin, orgMember, "Core Team");

            return (admin.Id, team.Id);
        });
    }
}
