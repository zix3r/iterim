using iterimApi.Models.Entities;

namespace iterimApi.Services.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
}