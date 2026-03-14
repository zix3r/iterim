import { Link } from 'react-router';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from './Sidebar';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white shadow-sm">
      <div className="flex h-14 items-center px-4 md:px-6 gap-4">
        
        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5 text-zinc-600" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-zinc-900 tracking-tight">
          <div className="bg-zinc-900 text-white p-1 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
              <path d="M15 9.75V7.5a.75.75 0 00-1.5 0v2.25h-3V7.5a.75.75 0 00-1.5 0v2.25H4.5v10.5a3 3 0 003 3h9a3 3 0 003-3V9.75H15z" />
            </svg>
          </div>
          Iterim
        </Link>

        <div className="flex-1" />

        {/* User Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                <Avatar className="h-9 w-9 border border-zinc-200">
                  <AvatarFallback className="bg-zinc-100 text-zinc-700 font-semibold">MS</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">User</p>
                  <p className="text-xs leading-none text-muted-foreground">user@iterim.lt</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}