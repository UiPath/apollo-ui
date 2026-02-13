import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart,
  Battery,
  Bell,
  Bookmark,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Code,
  Command,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  Filter,
  Folder,
  GitBranch,
  Github,
  Globe,
  Heart,
  HelpCircle,
  Home,
  Image,
  Info,
  Layers,
  Link,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Map as MapIcon,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Minus,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Music,
  Package,
  Pause,
  Phone,
  PhoneCall,
  PhoneOff,
  PieChart,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share,
  ShoppingCart,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Star,
  Sun,
  Tag,
  Terminal,
  Trash,
  TrendingDown,
  TrendingUp,
  Truck,
  Unlock,
  Upload,
  User,
  UserPlus,
  Users,
  Video,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Row, Column, Grid } from '@/components/ui/layout';

// All icons organized by category
const ICON_CATEGORIES = [
  {
    title: 'Navigation & Actions',
    icons: [
      { Icon: Home, name: 'Home' },
      { Icon: User, name: 'User' },
      { Icon: Settings, name: 'Settings' },
      { Icon: Search, name: 'Search' },
      { Icon: Menu, name: 'Menu' },
      { Icon: MoreVertical, name: 'MoreVertical' },
      { Icon: MoreHorizontal, name: 'MoreHorizontal' },
      { Icon: Filter, name: 'Filter' },
      { Icon: SlidersHorizontal, name: 'Sliders' },
      { Icon: RefreshCw, name: 'Refresh' },
      { Icon: LogOut, name: 'LogOut' },
      { Icon: LogIn, name: 'LogIn' },
    ],
  },
  {
    title: 'Arrows & Chevrons',
    icons: [
      { Icon: ChevronRight, name: 'ChevronRight' },
      { Icon: ChevronLeft, name: 'ChevronLeft' },
      { Icon: ChevronUp, name: 'ChevronUp' },
      { Icon: ChevronDown, name: 'ChevronDown' },
      { Icon: ArrowRight, name: 'ArrowRight' },
      { Icon: ArrowLeft, name: 'ArrowLeft' },
      { Icon: ArrowUp, name: 'ArrowUp' },
      { Icon: ArrowDown, name: 'ArrowDown' },
    ],
  },
  {
    title: 'Actions & Controls',
    icons: [
      { Icon: Plus, name: 'Plus' },
      { Icon: Minus, name: 'Minus' },
      { Icon: X, name: 'X' },
      { Icon: Check, name: 'Check' },
      { Icon: Edit, name: 'Edit' },
      { Icon: Trash, name: 'Trash' },
      { Icon: Copy, name: 'Copy' },
      { Icon: Share, name: 'Share' },
      { Icon: Download, name: 'Download' },
      { Icon: Upload, name: 'Upload' },
      { Icon: ExternalLink, name: 'ExternalLink' },
      { Icon: Link, name: 'Link' },
    ],
  },
  {
    title: 'Communication',
    icons: [
      { Icon: Mail, name: 'Mail' },
      { Icon: Bell, name: 'Bell' },
      { Icon: MessageSquare, name: 'MessageSquare' },
      { Icon: MessageCircle, name: 'MessageCircle' },
      { Icon: Phone, name: 'Phone' },
      { Icon: PhoneCall, name: 'PhoneCall' },
      { Icon: PhoneOff, name: 'PhoneOff' },
    ],
  },
  {
    title: 'Files & Media',
    icons: [
      { Icon: File, name: 'File' },
      { Icon: Folder, name: 'Folder' },
      { Icon: Image, name: 'Image' },
      { Icon: Video, name: 'Video' },
      { Icon: Music, name: 'Music' },
    ],
  },
  {
    title: 'Status & Alerts',
    icons: [
      { Icon: AlertCircle, name: 'AlertCircle' },
      { Icon: AlertTriangle, name: 'AlertTriangle' },
      { Icon: Info, name: 'Info' },
      { Icon: CheckCircle, name: 'CheckCircle' },
      { Icon: XCircle, name: 'XCircle' },
      { Icon: HelpCircle, name: 'HelpCircle' },
    ],
  },
  {
    title: 'Time & Calendar',
    icons: [
      { Icon: Calendar, name: 'Calendar' },
      { Icon: Clock, name: 'Clock' },
    ],
  },
  {
    title: 'Social & Favorites',
    icons: [
      { Icon: Heart, name: 'Heart' },
      { Icon: Star, name: 'Star' },
      { Icon: Bookmark, name: 'Bookmark' },
      { Icon: Tag, name: 'Tag' },
      { Icon: Users, name: 'Users' },
      { Icon: UserPlus, name: 'UserPlus' },
    ],
  },
  {
    title: 'Security & Privacy',
    icons: [
      { Icon: Lock, name: 'Lock' },
      { Icon: Unlock, name: 'Unlock' },
      { Icon: Eye, name: 'Eye' },
      { Icon: EyeOff, name: 'EyeOff' },
    ],
  },
  {
    title: 'Theme & Settings',
    icons: [
      { Icon: Sun, name: 'Sun' },
      { Icon: Moon, name: 'Moon' },
      { Icon: Zap, name: 'Zap' },
    ],
  },
  {
    title: 'Connectivity',
    icons: [
      { Icon: Wifi, name: 'Wifi' },
      { Icon: WifiOff, name: 'WifiOff' },
      { Icon: Battery, name: 'Battery' },
      { Icon: Globe, name: 'Globe' },
    ],
  },
  {
    title: 'Media Controls',
    icons: [
      { Icon: Play, name: 'Play' },
      { Icon: Pause, name: 'Pause' },
      { Icon: SkipForward, name: 'SkipForward' },
      { Icon: SkipBack, name: 'SkipBack' },
      { Icon: Volume2, name: 'Volume2' },
      { Icon: VolumeX, name: 'VolumeX' },
    ],
  },
  {
    title: 'Commerce',
    icons: [
      { Icon: ShoppingCart, name: 'ShoppingCart' },
      { Icon: CreditCard, name: 'CreditCard' },
      { Icon: DollarSign, name: 'DollarSign' },
    ],
  },
  {
    title: 'Analytics & Charts',
    icons: [
      { Icon: TrendingUp, name: 'TrendingUp' },
      { Icon: TrendingDown, name: 'TrendingDown' },
      { Icon: BarChart, name: 'BarChart' },
      { Icon: PieChart, name: 'PieChart' },
      { Icon: Activity, name: 'Activity' },
    ],
  },
  {
    title: 'Logistics',
    icons: [
      { Icon: Package, name: 'Package' },
      { Icon: Truck, name: 'Truck' },
      { Icon: MapPin, name: 'MapPin' },
      { Icon: MapIcon, name: 'Map' },
    ],
  },
  {
    title: 'Development',
    icons: [
      { Icon: Command, name: 'Command' },
      { Icon: Terminal, name: 'Terminal' },
      { Icon: Code, name: 'Code' },
      { Icon: GitBranch, name: 'GitBranch' },
      { Icon: Github, name: 'Github' },
      { Icon: Layers, name: 'Layers' },
    ],
  },
] as const;

// Total icon count
const TOTAL_ICONS = ICON_CATEGORIES.reduce((sum, cat) => sum + cat.icons.length, 0);

const meta = {
  title: 'Theme/Icons',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const IconGrid = ({
  icons,
  title,
}: {
  icons: Array<{
    Icon: React.ComponentType<{ className?: string }>;
    name: string;
  }>;
  title?: string;
}) => (
  <Column gap={4}>
    {title && <h3 className="text-lg font-semibold">{title}</h3>}
    <Grid cols={4} gap={4} className="sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
      {icons.map(({ Icon, name }) => (
        <Column
          key={name}
          align="center"
          gap={2}
          className="p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
          title={name}
        >
          <Icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs text-muted-foreground text-center break-all">{name}</span>
        </Column>
      ))}
    </Grid>
  </Column>
);

function IconsGallery() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return ICON_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return ICON_CATEGORIES.map((category) => ({
      ...category,
      icons: category.icons.filter((icon) => icon.name.toLowerCase().includes(query)),
    })).filter((category) => category.icons.length > 0);
  }, [searchQuery]);

  const matchCount = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.icons.length, 0);
  }, [filteredCategories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="relative px-8 py-12 max-w-7xl mx-auto">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Icon Library
              </h1>
              <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
                {TOTAL_ICONS} icons from lucide-react - a beautiful, consistent icon set
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
              />
              {searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {matchCount} found
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-10 max-w-7xl mx-auto space-y-12">
        {/* No results */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No icons found</h3>
            <p className="text-muted-foreground">
              Try a different search term like "arrow", "user", or "settings"
            </p>
          </div>
        ) : (
          <>
            {/* Icon Categories */}
            {filteredCategories.map((category) => (
              <IconGrid key={category.title} title={category.title} icons={[...category.icons]} />
            ))}

            {/* Icon Sizes */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">Icon Sizes</h2>
              <p className="text-muted-foreground">
                Common icon sizes using Tailwind width/height utilities
              </p>
              <Row align="center" gap={8}>
                <Column align="center" gap={2}>
                  <Home className="h-4 w-4" />
                  <Badge variant="outline" className="text-xs font-mono">
                    h-4 w-4
                  </Badge>
                </Column>
                <Column align="center" gap={2}>
                  <Home className="h-5 w-5" />
                  <Badge variant="outline" className="text-xs font-mono">
                    h-5 w-5
                  </Badge>
                </Column>
                <Column align="center" gap={2}>
                  <Home className="h-6 w-6" />
                  <Badge variant="outline" className="text-xs font-mono">
                    h-6 w-6
                  </Badge>
                </Column>
                <Column align="center" gap={2}>
                  <Home className="h-8 w-8" />
                  <Badge variant="outline" className="text-xs font-mono">
                    h-8 w-8
                  </Badge>
                </Column>
                <Column align="center" gap={2}>
                  <Home className="h-10 w-10" />
                  <Badge variant="outline" className="text-xs font-mono">
                    h-10 w-10
                  </Badge>
                </Column>
                <Column align="center" gap={2}>
                  <Home className="h-12 w-12" />
                  <Badge variant="outline" className="text-xs font-mono">
                    h-12 w-12
                  </Badge>
                </Column>
              </Row>
            </section>

            {/* Icon Colors */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">Icon Colors</h2>
              <p className="text-muted-foreground">
                Icons inherit text color and can use semantic color classes
              </p>
              <Row align="center" gap={8}>
                <Column align="center" gap={2}>
                  <Heart className="h-8 w-8 text-foreground" />
                  <Badge variant="outline" className="text-xs font-mono">
                    text-foreground
                  </Badge>
                </Column>
                <Column align="center" gap={2}>
                  <Heart className="h-8 w-8 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs font-mono">
                    text-muted-foreground
                  </Badge>
                </Column>
                <Column align="center" gap={2}>
                  <Heart className="h-8 w-8 text-primary" />
                  <Badge variant="outline" className="text-xs font-mono">
                    text-primary
                  </Badge>
                </Column>
                <Column align="center" gap={2}>
                  <Heart className="h-8 w-8 text-destructive" />
                  <Badge variant="outline" className="text-xs font-mono">
                    text-destructive
                  </Badge>
                </Column>
              </Row>
            </section>

            {/* Icon Buttons */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">Icon Buttons</h2>
              <p className="text-muted-foreground">Common patterns for using icons in buttons</p>
              <Row wrap="wrap" align="center" gap={4}>
                <Button>
                  <Plus className="h-4 w-4" />
                  Icon Left
                </Button>

                <Button>
                  Icon Right
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button size="icon">
                  <Settings className="h-4 w-4" />
                </Button>

                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <Heart className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </Row>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export const Default = {
  render: () => <IconsGallery />,
} satisfies Story;
