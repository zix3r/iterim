using iterimApi.Data;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var canConnect = await _db.Database.CanConnectAsync();

        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            database = canConnect ? "connected" : "disconnected"
        });
    }
}