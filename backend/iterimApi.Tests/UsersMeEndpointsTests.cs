using System.Security.Claims;
using iterimApi.Controllers;
using iterimApi.Data;
using iterimApi.DTOs.Users;
using iterimApi.Models.Entities;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace iterimApi.Tests;

public class UsersMeEndpointsTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static UsersController CreateController(AppDbContext db, int userId)
    {
        var recentPageService = new Mock<IRecentPageService>();
        var passwordHasher = new PasswordHasher<User>();
        var controller = new UsersController(recentPageService.Object, db, passwordHasher)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                    ],
                    "TestAuth"))
                }
            }
        };

        return controller;
    }

    private static async Task<User> AddUserAsync(
        AppDbContext db,
        string email,
        string name,
        string password)
    {
        var hasher = new PasswordHasher<User>();
        var user = new User
        {
            Email = email,
            Name = name,
            IsEmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user.PasswordHash = hasher.HashPassword(user, password);

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task PutMe_UpdatesNameAndEmail_WhenEmailIsUnique()
    {
        using var db = CreateDb();
        var user = await AddUserAsync(db, "john@example.com", "John", "Password123!");
        var controller = CreateController(db, user.Id);

        var result = await controller.UpdateCurrentUserProfile(new UpdateProfileDto
        {
            Name = "John Updated",
            Email = "john.updated@example.com"
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<CurrentUserProfileDto>(ok.Value);

        Assert.Equal("John Updated", payload.Name);
        Assert.Equal("john.updated@example.com", payload.Email);

        var updated = await db.Users.FindAsync(user.Id);
        Assert.NotNull(updated);
        Assert.Equal("John Updated", updated!.Name);
        Assert.Equal("john.updated@example.com", updated.Email);
    }

    [Fact]
    public async Task PutMe_ReturnsConflict_WhenEmailAlreadyTaken()
    {
        using var db = CreateDb();
        var user = await AddUserAsync(db, "john@example.com", "John", "Password123!");
        await AddUserAsync(db, "taken@example.com", "Taken", "Password123!");
        var controller = CreateController(db, user.Id);

        var result = await controller.UpdateCurrentUserProfile(new UpdateProfileDto
        {
            Name = "John Updated",
            Email = "taken@example.com"
        });

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.NotNull(conflict.Value);

        var unchanged = await db.Users.FindAsync(user.Id);
        Assert.NotNull(unchanged);
        Assert.Equal("john@example.com", unchanged!.Email);
    }

    [Fact]
    public async Task PutMePassword_ChangesPassword_WhenOldPasswordIsCorrect()
    {
        using var db = CreateDb();
        var user = await AddUserAsync(db, "john@example.com", "John", "Password123!");
        var controller = CreateController(db, user.Id);
        var verifier = new PasswordHasher<User>();

        var result = await controller.ChangeCurrentUserPassword(new ChangePasswordDto
        {
            OldPassword = "Password123!",
            NewPassword = "NewPassword456!"
        });

        Assert.IsType<NoContentResult>(result);

        var updated = await db.Users.FindAsync(user.Id);
        Assert.NotNull(updated);

        var oldPasswordCheck = verifier.VerifyHashedPassword(updated!, updated!.PasswordHash, "Password123!");
        var newPasswordCheck = verifier.VerifyHashedPassword(updated!, updated.PasswordHash, "NewPassword456!");

        Assert.Equal(PasswordVerificationResult.Failed, oldPasswordCheck);
        Assert.NotEqual(PasswordVerificationResult.Failed, newPasswordCheck);
    }

    [Fact]
    public async Task PutMePassword_ReturnsBadRequest_WhenOldPasswordIsWrong()
    {
        using var db = CreateDb();
        var user = await AddUserAsync(db, "john@example.com", "John", "Password123!");
        var controller = CreateController(db, user.Id);

        var result = await controller.ChangeCurrentUserPassword(new ChangePasswordDto
        {
            OldPassword = "WrongPassword123!",
            NewPassword = "NewPassword456!"
        });

        Assert.IsType<BadRequestObjectResult>(result);

        var unchanged = await db.Users.FindAsync(user.Id);
        Assert.NotNull(unchanged);

        var verifier = new PasswordHasher<User>();
        var oldPasswordCheck = verifier.VerifyHashedPassword(unchanged!, unchanged!.PasswordHash, "Password123!");
        Assert.NotEqual(PasswordVerificationResult.Failed, oldPasswordCheck);
    }
}
