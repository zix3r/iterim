using iterimApi.Models.Entities;

namespace iterimApi.Services;

public interface IJwtService
{
    string GenerateAccessToken(User user);
}