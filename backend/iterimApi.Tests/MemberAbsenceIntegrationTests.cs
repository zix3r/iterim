using System.Net;
using System.Net.Http.Json;
using iterimApi.Models.Enums;
using iterimApi.Tests.Infrastructure;

namespace iterimApi.Tests;

public class MemberAbsenceIntegrationTests : IClassFixture<ApiTestFactory>
{
    private readonly ApiTestFactory _factory;

    public MemberAbsenceIntegrationTests(ApiTestFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task MemberAbsence_MemberCanManageOwn_ButNotOthers()
    {
        await _factory.ResetDatabaseAsync();

        int orgId = 0;
        int memberUserId = 0;
        int memberOrgMemberId = 0;
        int otherOrgMemberId = 0;

        await _factory.ExecuteDbContextAsync(async db =>
        {
            var admin = await TestDataSeeder.CreateUserAsync(db, "admin.abs@example.com", "Abs Admin");
            var member = await TestDataSeeder.CreateUserAsync(db, "member.abs@example.com", "Abs Member");
            var other = await TestDataSeeder.CreateUserAsync(db, "other.abs@example.com", "Abs Other");

            var (org, _) = await TestDataSeeder.CreateOrganizationWithAdminAsync(db, admin, "Abs Org");
            var memberMembership = await TestDataSeeder.AddOrganizationMemberAsync(db, org, member, OrgMemberRole.Member);
            var otherMembership = await TestDataSeeder.AddOrganizationMemberAsync(db, org, other, OrgMemberRole.Member);

            orgId = org.Id;
            memberUserId = member.Id;
            memberOrgMemberId = memberMembership.Id;
            otherOrgMemberId = otherMembership.Id;
        });

        using var memberClient = _factory.CreateApiClient(memberUserId);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var createOwnResponse = await memberClient.PostAsJsonAsync(
            $"/api/organizations/{orgId}/absences",
            new
            {
                orgMemberId = memberOrgMemberId,
                fromDate = today,
                toDate = today.AddDays(1),
                reason = "Sick"
            });

        Assert.Equal(HttpStatusCode.OK, createOwnResponse.StatusCode);

        var createOtherResponse = await memberClient.PostAsJsonAsync(
            $"/api/organizations/{orgId}/absences",
            new
            {
                orgMemberId = otherOrgMemberId,
                fromDate = today,
                toDate = today,
                reason = "Vacation"
            });

        Assert.Equal(HttpStatusCode.Forbidden, createOtherResponse.StatusCode);
    }

    [Fact]
    public async Task MemberAbsence_AdminCanUpdateAndDeleteOthersAbsence()
    {
        await _factory.ResetDatabaseAsync();

        int orgId = 0;
        int adminUserId = 0;
        int memberOrgMemberId = 0;

        await _factory.ExecuteDbContextAsync(async db =>
        {
            var admin = await TestDataSeeder.CreateUserAsync(db, "admin2.abs@example.com", "Abs Admin");
            var member = await TestDataSeeder.CreateUserAsync(db, "member2.abs@example.com", "Abs Member");

            var (org, _) = await TestDataSeeder.CreateOrganizationWithAdminAsync(db, admin, "Abs Org 2");
            var memberMembership = await TestDataSeeder.AddOrganizationMemberAsync(db, org, member, OrgMemberRole.Member);

            orgId = org.Id;
            adminUserId = admin.Id;
            memberOrgMemberId = memberMembership.Id;
        });

        using var adminClient = _factory.CreateApiClient(adminUserId);
        var from = DateOnly.FromDateTime(DateTime.UtcNow);
        var to = from.AddDays(2);

        var createResponse = await adminClient.PostAsJsonAsync(
            $"/api/organizations/{orgId}/absences",
            new
            {
                orgMemberId = memberOrgMemberId,
                fromDate = from,
                toDate = to,
                reason = "Vacation"
            });

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        using var createJson = await TestJsonHelpers.ReadJsonAsync(createResponse);
        var absenceId = createJson.RootElement.GetProperty("id").GetInt32();

        var updateResponse = await adminClient.PutAsJsonAsync(
            $"/api/absences/{absenceId}",
            new
            {
                orgMemberId = memberOrgMemberId,
                fromDate = from,
                toDate = to.AddDays(1),
                reason = "Other",
                otherReason = "Doctor appointment"
            });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await adminClient.DeleteAsync($"/api/absences/{absenceId}");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);
    }
}
