using System.Net;
using System.Net.Http.Json;
using iterimApi.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Tests;

public class OrganizationsProductsTeamsIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public OrganizationsProductsTeamsIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Organizations_MainFlow_CreateGetMembersDelete_AndForeignAccessForbidden()
    {
        await _factory.ResetDatabaseAsync();

        int adminId = 0;
        int outsiderId = 0;

        await _factory.ExecuteDbContextAsync(async db =>
        {
            var admin = await TestDataSeeder.CreateUserAsync(db, "admin.org@example.com", "Org Admin");
            var outsider = await TestDataSeeder.CreateUserAsync(db, "outsider.org@example.com", "Org Outsider");
            await TestDataSeeder.CreateUserAsync(db, "invitee.org@example.com", "Org Invitee");

            adminId = admin.Id;
            outsiderId = outsider.Id;
        });

        using var adminClient = _factory.CreateApiClient(adminId);
        using var outsiderClient = _factory.CreateApiClient(outsiderId);

        var createOrgResponse = await adminClient.PostAsJsonAsync("/api/organizations", new { name = "Org Alpha" });
        Assert.Equal(HttpStatusCode.Created, createOrgResponse.StatusCode);

        using var createOrgJson = await TestJsonHelpers.ReadJsonAsync(createOrgResponse);
        var orgId = createOrgJson.RootElement.GetProperty("id").GetInt32();

        var createProductResponse = await adminClient.PostAsJsonAsync(
            $"/api/organizations/{orgId}/products",
            new { name = "Org Product", description = "Org Product Description" });
        Assert.Equal(HttpStatusCode.Created, createProductResponse.StatusCode);

        using var createProductJson = await TestJsonHelpers.ReadJsonAsync(createProductResponse);
        var productId = createProductJson.RootElement.GetProperty("id").GetInt32();

        var createTeamResponse = await adminClient.PostAsJsonAsync(
            $"/api/products/{productId}/teams",
            new { name = "Org Team", description = "Org Team Description" });
        Assert.Equal(HttpStatusCode.Created, createTeamResponse.StatusCode);

        using var createTeamJson = await TestJsonHelpers.ReadJsonAsync(createTeamResponse);
        var teamId = createTeamJson.RootElement.GetProperty("id").GetInt32();

        var getOrgResponse = await adminClient.GetAsync($"/api/organizations/{orgId}");
        Assert.Equal(HttpStatusCode.OK, getOrgResponse.StatusCode);

        var addMemberResponse = await adminClient.PostAsJsonAsync(
            $"/api/organizations/{orgId}/members",
            new { email = "invitee.org@example.com", role = "Member" });
        Assert.Equal(HttpStatusCode.OK, addMemberResponse.StatusCode);

        using var addMemberJson = await TestJsonHelpers.ReadJsonAsync(addMemberResponse);
        var memberId = addMemberJson.RootElement.GetProperty("id").GetInt32();

        var foreignAccessResponse = await outsiderClient.GetAsync($"/api/organizations/{orgId}");
        Assert.Equal(HttpStatusCode.Forbidden, foreignAccessResponse.StatusCode);

        var removeMemberResponse = await adminClient.DeleteAsync($"/api/organizations/{orgId}/members/{memberId}");
        Assert.Equal(HttpStatusCode.NoContent, removeMemberResponse.StatusCode);

        var deleteOrgResponse = await adminClient.DeleteAsync($"/api/organizations/{orgId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteOrgResponse.StatusCode);

        await _factory.ExecuteDbContextAsync(async db =>
        {
            Assert.False(await db.Organizations.AnyAsync(o => o.Id == orgId));
            Assert.False(await db.Products.AnyAsync(p => p.Id == productId));
            Assert.False(await db.Teams.AnyAsync(t => t.Id == teamId));
        });
    }

    [Fact]
    public async Task AddOrganizationMember_ToMissingOrganization_ReturnsNotFoundWithMessage()
    {
        await _factory.ResetDatabaseAsync();

        int adminId = 0;

        await _factory.ExecuteDbContextAsync(async db =>
        {
            var admin = await TestDataSeeder.CreateUserAsync(db, "admin.missing@example.com", "Org Admin");
            await TestDataSeeder.CreateUserAsync(db, "member.missing@example.com", "Missing Member");
            adminId = admin.Id;
        });

        using var adminClient = _factory.CreateApiClient(adminId);

        var response = await adminClient.PostAsJsonAsync(
            "/api/organizations/999999/members",
            new { email = "member.missing@example.com", role = "Member" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        using var payload = await TestJsonHelpers.ReadJsonAsync(response);
        var message = payload.RootElement.GetProperty("message").GetString();
        Assert.Contains("Organization not found", message);
    }

    [Fact]
    public async Task Products_MainCrud_AndDeleteCascades_WhenTeamsExist()
    {
        await _factory.ResetDatabaseAsync();

        int adminId = 0;
        int orgId = 0;

        await _factory.ExecuteDbContextAsync(async db =>
        {
            var admin = await TestDataSeeder.CreateUserAsync(db, "admin.product@example.com", "Product Admin");
            var (organization, _) = await TestDataSeeder.CreateOrganizationWithAdminAsync(db, admin, "Product Org");

            adminId = admin.Id;
            orgId = organization.Id;
        });

        using var client = _factory.CreateApiClient(adminId);

        var createProductResponse = await client.PostAsJsonAsync(
            $"/api/organizations/{orgId}/products",
            new { name = "Product One", description = "Description" });
        Assert.Equal(HttpStatusCode.Created, createProductResponse.StatusCode);

        using var createProductJson = await TestJsonHelpers.ReadJsonAsync(createProductResponse);
        var productId = createProductJson.RootElement.GetProperty("id").GetInt32();

        var getProductResponse = await client.GetAsync($"/api/products/{productId}");
        Assert.Equal(HttpStatusCode.OK, getProductResponse.StatusCode);

        var updateProductResponse = await client.PutAsJsonAsync(
            $"/api/products/{productId}",
            new { name = "Product One Updated", description = "Updated" });
        Assert.Equal(HttpStatusCode.OK, updateProductResponse.StatusCode);

        var createTeamResponse = await client.PostAsJsonAsync(
            $"/api/products/{productId}/teams",
            new { name = "Team One", description = "Team Description" });
        Assert.Equal(HttpStatusCode.Created, createTeamResponse.StatusCode);

        using var createTeamJson = await TestJsonHelpers.ReadJsonAsync(createTeamResponse);
        var teamId = createTeamJson.RootElement.GetProperty("id").GetInt32();

        var deleteProductResponse = await client.DeleteAsync($"/api/products/{productId}");
        Assert.Equal(HttpStatusCode.OK, deleteProductResponse.StatusCode);

        await _factory.ExecuteDbContextAsync(async db =>
        {
            Assert.False(await db.Products.AnyAsync(p => p.Id == productId));
            Assert.False(await db.Teams.AnyAsync(t => t.Id == teamId));
        });
    }

    [Fact]
    public async Task ProductValidation_ReturnsFieldLevelErrors_ForMissingName()
    {
        await _factory.ResetDatabaseAsync();

        int adminId = 0;
        int orgId = 0;

        await _factory.ExecuteDbContextAsync(async db =>
        {
            var admin = await TestDataSeeder.CreateUserAsync(db, "admin.validation@example.com", "Validation Admin");
            var (organization, _) = await TestDataSeeder.CreateOrganizationWithAdminAsync(db, admin, "Validation Org");

            adminId = admin.Id;
            orgId = organization.Id;
        });

        using var client = _factory.CreateApiClient(adminId);

        var response = await client.PostAsJsonAsync(
            $"/api/organizations/{orgId}/products",
            new { name = "", description = "x" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        using var payload = await TestJsonHelpers.ReadJsonAsync(response);
        Assert.True(payload.RootElement.TryGetProperty("errors", out var errors));
        var hasNameError = errors
            .EnumerateObject()
            .Any(p => string.Equals(p.Name, "name", StringComparison.OrdinalIgnoreCase));
        Assert.True(hasNameError);
    }
}
