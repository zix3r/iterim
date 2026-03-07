using iterimApi.DTOs.Products;

namespace iterimApi.Services.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetProductsByOrganizationAsync(int organizationId, int userId);
    Task<ProductDetailDto?> GetProductByIdAsync(int productId, int userId);
    Task<ProductDto?> CreateProductAsync(int organizationId, CreateProductDto dto, int userId);
    Task<ProductDto?> UpdateProductAsync(int productId, UpdateProductDto dto, int userId);
    Task<bool> DeleteProductAsync(int productId, int userId);
}
