using iterimApi.Data;
using iterimApi.DTOs.Products;
using iterimApi.Models.Entities;
using iterimApi.Models.Enums;
using iterimApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace iterimApi.Services.Implementations;

public class ProductService : IProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ProductDto>> GetProductsByOrganizationAsync(int organizationId, int userId)
    {
        // Check if user is a member of the organization
        var isMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == organizationId && 
                          m.UserId == userId && 
                          m.Status == OrgMemberStatus.Active);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        var products = await _db.Products
            .Where(p => p.OrganizationId == organizationId)
            .Include(p => p.CreatedByUser)
            .Include(p => p.UpdatedByUser)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                OrganizationId = p.OrganizationId,
                Name = p.Name,
                Description = p.Description,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                CreatedBy = p.CreatedBy,
                UpdatedBy = p.UpdatedBy,
                CreatedByName = p.CreatedByUser.Name,
                UpdatedByName = p.UpdatedByUser.Name
            })
            .ToListAsync();

        return products;
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(int productId, int userId)
    {
        var product = await _db.Products
            .Include(p => p.Organization)
            .Include(p => p.CreatedByUser)
            .Include(p => p.UpdatedByUser)
            .Include(p => p.Teams)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            return null;
        }

        // Check if user is a member of the organization
        var isMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == product.OrganizationId && 
                          m.UserId == userId && 
                          m.Status == OrgMemberStatus.Active);

        if (!isMember)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        return new ProductDetailDto
        {
            Id = product.Id,
            OrganizationId = product.OrganizationId,
            OrganizationName = product.Organization.Name,
            Name = product.Name,
            Description = product.Description,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            CreatedBy = product.CreatedBy,
            UpdatedBy = product.UpdatedBy,
            CreatedByName = product.CreatedByUser.Name,
            UpdatedByName = product.UpdatedByUser.Name,
            TeamCount = product.Teams.Count
        };
    }

    public async Task<ProductDto?> CreateProductAsync(int organizationId, CreateProductDto dto, int userId)
    {
        // Check if user is a member of the organization with appropriate permissions
        var member = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (member == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Only Admin can create products
        if (member.Role != OrgMemberRole.Admin)
        {
            throw new UnauthorizedAccessException("User does not have permission to create products");
        }

        var product = new Product
        {
            OrganizationId = organizationId,
            Name = dto.Name,
            Description = dto.Description,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        // Load navigation properties for DTO
        await _db.Entry(product).Reference(p => p.CreatedByUser).LoadAsync();
        await _db.Entry(product).Reference(p => p.UpdatedByUser).LoadAsync();

        return new ProductDto
        {
            Id = product.Id,
            OrganizationId = product.OrganizationId,
            Name = product.Name,
            Description = product.Description,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            CreatedBy = product.CreatedBy,
            UpdatedBy = product.UpdatedBy,
            CreatedByName = product.CreatedByUser.Name,
            UpdatedByName = product.UpdatedByUser.Name
        };
    }

    public async Task<bool> DeleteProductAsync(int productId, int userId)
    {
        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            return false;
        }

        // Check if user is a member of the organization with appropriate permissions
        var member = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == product.OrganizationId && 
                                     m.UserId == userId && 
                                     m.Status == OrgMemberStatus.Active);

        if (member == null)
        {
            throw new UnauthorizedAccessException("User is not a member of this organization");
        }

        // Only Admin can delete products
        if (member.Role != OrgMemberRole.Admin)
        {
            throw new UnauthorizedAccessException("User does not have permission to delete products");
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();

        return true;
    }
}
