using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.Teams;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace iterimApi.Controllers;
using iterimApi.DTOs.Planning;

[ApiController]
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;


    public TeamsController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    /// <summary>
    /// Get all teams for a specific product
    /// </summary>
    [HttpGet("api/products/{productId}/teams")]
    public async Task<IActionResult> GetTeamsByProduct(int productId)
    {
        try
        {
            var userId = GetUserId();
            var teams = await _teamService.GetTeamsByProductAsync(productId, userId);
            return Ok(teams);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving teams", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new team in a product
    /// </summary>
    [HttpPost("api/products/{productId}/teams")]
    public async Task<IActionResult> CreateTeam(int productId, [FromBody] CreateTeamDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var team = await _teamService.CreateTeamAsync(productId, dto, userId);

            if (team == null)
            {
                return BadRequest(new { message = "Failed to create team" });
            }

            return CreatedAtAction(
                nameof(GetTeamById),
                new { id = team.Id },
                team
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the team", error = ex.Message });
        }
    }

    /// <summary>
    /// Get team details with members by ID
    /// </summary>
    [HttpGet("api/teams/{id}")]
    public async Task<IActionResult> GetTeamById(int id)
    {
        try
        {
            var userId = GetUserId();
            var team = await _teamService.GetTeamByIdAsync(id, userId);

            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            return Ok(team);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the team", error = ex.Message });
        }
    }
    
// GET /api/teams/{teamId}/quarter-plan
    [HttpGet("api/teams/{teamId:int}/quarter-plan")]
    public async Task<ActionResult<QuarterPlanDto>> GetQuarterPlan(
        int teamId, 
        [FromQuery] string start, 
        [FromQuery] string end)
    {
        // 1. Patikriname datas
        if (!DateOnly.TryParse(start, out var startDate) || !DateOnly.TryParse(end, out var endDate))
        {
            return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD." });
        }

        if (startDate > endDate)
        {
            return BadRequest(new { message = "Start date must be before end date." });
        }

        // 2. Kviečiame mūsų sukurtą servisą
        var quarterPlan = await _teamService.GetQuarterPlanAsync(teamId, startDate, endDate);
        
        return Ok(quarterPlan);
    }
    /// <summary>
    /// Update team details
    /// </summary>
    [HttpPut("api/teams/{id}")]
    public async Task<IActionResult> UpdateTeam(int id, [FromBody] UpdateTeamDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var team = await _teamService.UpdateTeamAsync(id, dto, userId);

            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            return Ok(team);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the team", error = ex.Message });
        }
    }

    /// <summary>
    /// Add a member to a team
    /// </summary>
    [HttpPost("api/teams/{id}/members")]
    public async Task<IActionResult> AddTeamMember(int id, [FromBody] AddTeamMemberDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var teamMember = await _teamService.AddTeamMemberAsync(id, dto, userId);

            if (teamMember == null)
            {
                return BadRequest(new { message = "Failed to add team member" });
            }

            return Ok(teamMember);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while adding the team member", error = ex.Message });
        }
    }

    /// <summary>
    /// Update a team member's role
    /// </summary>
    [HttpPut("api/teams/{id}/members/{memberUserId}")]
    public async Task<IActionResult> UpdateTeamMemberRole(int id, int memberUserId, [FromBody] UpdateTeamMemberRoleDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var teamMember = await _teamService.UpdateTeamMemberRoleAsync(id, memberUserId, dto, userId);

            if (teamMember == null)
            {
                return NotFound(new { message = "Team member not found" });
            }

            return Ok(teamMember);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the team member role", error = ex.Message });
        }
    }

    /// <summary>
    /// Remove a member from a team
    /// </summary>
    [HttpDelete("api/teams/{id}/members/{userId}")]
    public async Task<IActionResult> RemoveTeamMember(int id, int userId)
    {
        try
        {
            var requesterId = GetUserId();
            var result = await _teamService.RemoveTeamMemberAsync(id, requesterId, userId);

            if (!result)
            {
                return NotFound(new { message = "Team member not found" });
            }

            return Ok(new { message = "Team member removed successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while removing the team member", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a team
    /// </summary>
    [HttpDelete("api/teams/{id}")]
    public async Task<IActionResult> DeleteTeam(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _teamService.DeleteTeamAsync(id, userId);

            if (!result)
            {
                return NotFound(new { message = "Team not found" });
            }

            return Ok(new { message = "Team deleted successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the team", error = ex.Message });
        }
    }

    /// <summary>
    /// Helper method to extract user ID from JWT claims
    /// </summary>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user authentication");
        }

        return userId;
    }
    /// <summary>
    /// PUT /api/teams/{teamId}/members/{memberId}/schedule
    /// </summary>
    /// <summary>
    /// PUT /api/teams/{teamId}/members/{memberId}/schedule
    /// </summary>
    [HttpPut("api/teams/{teamId}/members/{memberId}/schedule")]
    public async Task<IActionResult> UpdateMemberSchedule(int teamId, int memberId, [FromBody] UpdateTeamMemberScheduleDto dto)
    {
        try
        {
            // 1. NAUDOJAME SAUGŲ METODĄ (pataiso NullReferenceException)
            var userId = GetUserId(); 

            if (dto == null) return BadRequest(new { message = "Request body is empty" });

            await _teamService.UpdateMemberScheduleAsync(teamId, memberId, dto, userId);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            // Jei vartotojas neturi teisių (pvz., nėra komandos adminas)
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            // Grąžiname detalią klaidą, jei vėl kas nors nepavyktų
            return StatusCode(500, new { message = "Internal server error", detail = ex.Message });
        }
    }

    /* kol kas užkomentuoju, neįsivaizduoju kam reikalingas
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly IBoardService _boardService;

        public TeamsController(IBoardService boardService)
        {
            _boardService = boardService;
        }

        // GET /api/teams/{teamId}/board
        [HttpGet("{teamId}/board")]
        public async Task<IActionResult> GetTeamBoard(int teamId)
        {
            var board = await _boardService.GetActiveIterationBoardAsync(teamId);

            // Pagal kriterijus: Jei nėra, grąžina tuščią arba 404
            if (board == null)
            {
                return NotFound(new { message = "No active iteration found for this team." });
            }

            return Ok(board);
        }
    }
    */
}
