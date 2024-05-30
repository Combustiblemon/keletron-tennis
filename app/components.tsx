// eslint-disable-next-line import/no-unresolved
import '../../../../../node_modules/flag-icons/css/flag-icons.min.css';

import { Moon, Settings, Sun } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useAppMode } from '@/context/AppModeContext';
import { cn } from '@/lib/utils';

export const MainNav = ({
  className,
  entries = [],
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  entries?: { href: string; label: string }[];
}) => {
  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {entries.map((entry, i) => (
        <Link
          key={entry.href}
          href={entry.href}
          className={`text-sm font-medium ${i > 0 ? 'text-muted-foreground' : ''} transition-colors hover:text-primary`}
        >
          {entry.label}
        </Link>
      ))}
    </nav>
  );
};

export const SettingsSheet = () => {
  const appModeContext = useAppMode();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost">
          <Settings size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Change your app settings</SheetDescription>
        </SheetHeader>
        <div className="p-4 space-y-4 flex-col flex">
          <div className="flex gap-2">
            <Sun size={24} color="hsl(var(--muted-foreground))" />
            <Switch
              onCheckedChange={(state) =>
                appModeContext.setMode(state ? 'dark' : 'light')
              }
            />
            <Moon size={24} color="hsl(var(--muted-foreground))" />
          </div>
          <div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  <span className="fi fi-gb" /> English
                </SelectItem>
                <SelectItem value="el">
                  <span className="fi fi-gr" /> Greek
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
