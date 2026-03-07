import { Link, useLocation, useParams } from 'react-router';

export function Sidebar() {
  const location = useLocation();
  const { orgId, productId } = useParams(); // Paima ID jei esame /org/:orgId maršrute

  return (
    <div className="w-64 border-r h-screen p-4 flex flex-col gap-2">
      <div className="font-bold text-xl mb-6 px-2">Iterim</div>
      
      <Link to="/dashboard" className={`px-4 py-2 rounded-md hover:bg-muted ${location.pathname === '/dashboard' ? 'bg-muted' : ''}`}>
        Dashboard
      </Link>

      {/* Organizacijos lygio navigacija rodoma tik jei esame organizacijoje */}
      {orgId && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase px-4 mb-2">Organization</p>
          <Link to={`/org/${orgId}`} className={`block px-4 py-2 rounded-md hover:bg-muted ${location.pathname === `/org/${orgId}` ? 'bg-muted' : ''}`}>
            Members
          </Link>
          <Link to={`/org/${orgId}/products`} className={`block px-4 py-2 rounded-md hover:bg-muted ${location.pathname === `/org/${orgId}/products` ? 'bg-muted' : ''}`}>
            Products
          </Link>
          <Link to={`/org/${orgId}/settings`} className="block px-4 py-2 rounded-md hover:bg-muted">
            Settings
          </Link>
        </div>
      )}

      {/* Produkto lygio navigacija rodoma tik jei esame produkte */}
      {orgId && productId && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase px-4 mb-2">Product</p>
          <Link to={`/org/${orgId}/products/${productId}`} className={`block px-4 py-2 rounded-md hover:bg-muted ${location.pathname === `/org/${orgId}/products/${productId}` ? 'bg-muted' : ''}`}>
            Overview
          </Link>
          <Link to={`/org/${orgId}/products/${productId}/backlog`} className="block px-4 py-2 rounded-md hover:bg-muted">
            Backlog
          </Link>
          <Link to={`/org/${orgId}/products/${productId}/teams`} className="block px-4 py-2 rounded-md hover:bg-muted">
            Teams
          </Link>
          <Link to={`/org/${orgId}/products/${productId}/iterations`} className="block px-4 py-2 rounded-md hover:bg-muted">
            Iterations
          </Link>
        </div>
      )}
    </div>
  );
}