import { Link, useParams } from 'react-router';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Product } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  const { orgId } = useParams();
  
  return (
    <Link 
      to={`/org/${orgId}/products/${product.id}`} 
      className="block transition-transform hover:scale-[1.02]"
    >
      <Card className="cursor-pointer hover:border-primary/50">
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          {product.description && (
            <CardDescription>{product.description}</CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
