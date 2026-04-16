using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using iterimApi.DTOs.Products;
using iterimApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iterimApi.Controllers;

[ApiController]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>
    /// Get all products for a specific organization
    /// </summary>
    [HttpGet("api/organizations/{orgId}/products")]
    public async Task<IActionResult> GetProductsByOrganization(int orgId)
    {
        try
        {
            var userId = GetUserId();
            var products = await _productService.GetProductsByOrganizationAsync(orgId, userId);
            return Ok(products);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving products", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new product in an organization
    /// </summary>
    [HttpPost("api/organizations/{orgId}/products")]
    public async Task<IActionResult> CreateProduct(int orgId, [FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var product = await _productService.CreateProductAsync(orgId, dto, userId);
            
            if (product == null)
            {
                return BadRequest(new { message = "Failed to create product" });
            }

            return CreatedAtAction(
                nameof(GetProductById), 
                new { id = product.Id }, 
                product
            );
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the product", error = ex.Message });
        }
    }

    /// <summary>
    /// Get product details by ID
    /// </summary>
    [HttpGet("api/products/{id}")]
    public async Task<IActionResult> GetProductById(int id)
    {
        try
        {
            var userId = GetUserId();
            var product = await _productService.GetProductByIdAsync(id, userId);

            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(product);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving the product", error = ex.Message });
        }
    }

    /// <summary>
    /// Update a product by ID
    /// </summary>
    [HttpPut("api/products/{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var userId = GetUserId();
            var product = await _productService.UpdateProductAsync(id, dto, userId);

            if (product == null)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(product);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the product", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a product by ID
    /// </summary>
    [HttpDelete("api/products/{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _productService.DeleteProductAsync(id, userId);

            if (!result)
            {
                return NotFound(new { message = "Product not found" });
            }

            return Ok(new { message = "Product deleted successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while deleting the product", error = ex.Message });
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
}
