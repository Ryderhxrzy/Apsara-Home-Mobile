import React from "react"
import { StyleProp, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import {
  Plus,
  PlusCircle,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ShoppingBag,
  ShoppingCart,
  BarChart3,
  Book,
  Calendar,
  Phone,
  Camera,
  Car,
  CreditCard,
  Banknote,
  Check,
  CheckCheck,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  XCircle,
  Palette,
  Copy,
  Package,
  MoreVertical,
  Expand,
  Eye,
  EyeOff,
  Fingerprint,
  Flag,
  Zap,
  FolderOpen,
  Folder,
  Gift,
  Network,
  Globe,
  LayoutGrid,
  Handshake,
  Heart,
  Home,
  Hourglass,
  Hash,
  Image as ImageIcon,
  Inbox,
  Infinity as InfinityIcon,
  Info,
  Layers,
  Link,
  List,
  MapPin,
  Lock,
  LogOut,
  LogIn,
  Mail,
  Map as MapIcon,
  Megaphone,
  Mic,
  Moon,
  Bell,
  ExternalLink,
  SlidersHorizontal,
  KeyRound,
  Users,
  User,
  UserPlus,
  CircleUser,
  Smartphone,
  PieChart,
  Award,
  Tag,
  QrCode,
  Receipt,
  RefreshCw,
  Minus,
  Repeat,
  Maximize2,
  GraduationCap,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Shield,
  Store,
  Sparkles,
  Star,
  Ticket,
  Clock,
  Trash2,
  TrendingUp,
  Trophy,
  Unlink,
  Monitor,
  Wallet,
  Gem,
  Pencil,
  Circle,
  type LucideIcon,
} from "lucide-react-native"

/**
 * App-wide icon component, backed by lucide-react-native.
 *
 * Call sites keep using Ionicons-style string names (`<Icon name="cart-outline" />`)
 * so the migration is a drop-in: this maps each name to its lucide equivalent.
 * lucide is a single (stroke) style, so `-outline` and solid Ionicons names map to
 * the same lucide glyph; `heart`/`star` are rendered filled to preserve their
 * active-state look.
 *
 * Two things still defer to Ionicons (lucide has no equivalent):
 *  - brand logos (`logo-google`, `logo-apple`, …) — lucide ships no brand marks.
 *  - any unmapped name — safe fallback so nothing ever renders blank (warns in dev).
 */
const MAP: Record<string, LucideIcon> = {
  add: Plus,
  "add-outline": Plus,
  "add-circle": PlusCircle,
  "alert-circle": AlertCircle,
  "alert-circle-outline": AlertCircle,
  warning: AlertTriangle,
  "arrow-back": ArrowLeft,
  "arrow-forward": ArrowRight,
  "arrow-forward-outline": ArrowRight,
  "arrow-up": ArrowUp,
  "swap-vertical": ArrowUpDown,
  "swap-vertical-outline": ArrowUpDown,
  "bag-check": ShoppingBag,
  "bag-check-outline": ShoppingBag,
  "bag-handle": ShoppingBag,
  "bag-handle-outline": ShoppingBag,
  "bag-outline": ShoppingBag,
  cart: ShoppingCart,
  "cart-outline": ShoppingCart,
  "bar-chart": BarChart3,
  book: Book,
  calendar: Calendar,
  "calendar-today": Calendar,
  time: Clock,
  "time-outline": Clock,
  hourglass: Hourglass,
  "hourglass-outline": Hourglass,
  call: Phone,
  "call-outline": Phone,
  phone: Phone,
  "phone-portrait": Smartphone,
  camera: Camera,
  "camera-outline": Camera,
  car: Car,
  "car-outline": Car,
  card: CreditCard,
  "card-outline": CreditCard,
  cash: Banknote,
  "cash-outline": Banknote,
  wallet: Wallet,
  "wallet-outline": Wallet,
  checkmark: Check,
  "checkmark-done": CheckCheck,
  "checkmark-circle": CheckCircle,
  "checkmark-circle-outline": CheckCircle,
  checkbox: CheckSquare,
  "chevron-back": ChevronLeft,
  "chevron-back-outline": ChevronLeft,
  "chevron-forward": ChevronRight,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  close: X,
  "close-circle": XCircle,
  "close-circle-outline": XCircle,
  "ellipse-outline": Circle,
  "ellipsis-vertical": MoreVertical,
  "color-palette": Palette,
  "color-palette-outline": Palette,
  copy: Copy,
  "copy-outline": Copy,
  cube: Package,
  "cube-outline": Package,
  "expand-outline": Expand,
  resize: Maximize2,
  eye: Eye,
  "eye-outline": Eye,
  "eye-off": EyeOff,
  "eye-off-outline": EyeOff,
  "finger-print": Fingerprint,
  flag: Flag,
  flash: Zap,
  "folder-open-outline": FolderOpen,
  "folder-outline": Folder,
  gift: Gift,
  "gift-outline": Gift,
  "git-network-outline": Network,
  globe: Globe,
  "globe-outline": Globe,
  grid: LayoutGrid,
  "grid-outline": LayoutGrid,
  layers: Layers,
  handshake: Handshake,
  heart: Heart,
  "heart-outline": Heart,
  wishlist: Heart,
  home: Home,
  "home-outline": Home,
  identifier: Hash,
  "image-outline": ImageIcon,
  images: ImageIcon,
  inbox: Inbox,
  infinite: InfinityIcon,
  "information-circle": Info,
  "information-circle-outline": Info,
  link: Link,
  list: List,
  "list-outline": List,
  location: MapPin,
  "location-outline": MapPin,
  map: MapIcon,
  "lock-closed": Lock,
  "lock-closed-outline": Lock,
  "key-outline": KeyRound,
  password: KeyRound,
  "log-out": LogOut,
  "log-out-outline": LogOut,
  logout: LogOut,
  "log-in": LogIn,
  login: LogIn,
  mail: Mail,
  "mail-outline": Mail,
  megaphone: Megaphone,
  mic: Mic,
  "mic-outline": Mic,
  "moon-outline": Moon,
  notification: Bell,
  notifications: Bell,
  "notifications-outline": Bell,
  "open-outline": ExternalLink,
  "options-outline": SlidersHorizontal,
  settings: Settings,
  "settings-outline": Settings,
  people: Users,
  "people-outline": Users,
  person: User,
  "person-outline": User,
  profile: User,
  "person-add": UserPlus,
  "person-add-outline": UserPlus,
  "person-circle": CircleUser,
  "pie-chart": PieChart,
  podium: Award,
  ribbon: Award,
  "ribbon-outline": Award,
  pricetag: Tag,
  "pricetag-outline": Tag,
  qr: QrCode,
  "qr-code": QrCode,
  "qr-code-outline": QrCode,
  receipt: Receipt,
  refresh: RefreshCw,
  "refresh-outline": RefreshCw,
  remove: Minus,
  repeat: Repeat,
  school: GraduationCap,
  search: Search,
  "search-outline": Search,
  send: Send,
  "share-social": Share2,
  "share-social-outline": Share2,
  "share-outline": Share2,
  shield: Shield,
  "shield-checkmark": ShieldCheck,
  "shield-checkmark-outline": ShieldCheck,
  shop: Store,
  storefront: Store,
  sparkles: Sparkles,
  "sparkles-outline": Sparkles,
  star: Star,
  "star-outline": Star,
  "ticket-outline": Ticket,
  trash: Trash2,
  "trash-outline": Trash2,
  pencil: Pencil,
  "trending-up": TrendingUp,
  "trending-up-outline": TrendingUp,
  trophy: Trophy,
  "trophy-outline": Trophy,
  unlink: Unlink,
  viewport: Monitor,
  diamond: Gem,
  "diamond-outline": Gem,
}

// Names rendered filled (vs lucide's default stroke) so their active state reads.
const FILLED = new Set(["heart", "star", "wishlist"])

export type IconName = string

export interface IconProps {
  name: string
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}

function Icon({ name, size = 24, color, style, ...rest }: IconProps) {
  // lucide has no brand logos — keep those on Ionicons.
  if (name && name.startsWith("logo-")) {
    return (
      <Ionicons
        name={name as keyof typeof Ionicons.glyphMap}
        size={size}
        color={color}
        style={style}
        {...rest}
      />
    )
  }

  const Lucide = MAP[name]
  if (!Lucide) {
    if (__DEV__ && name) {
      console.warn(
        `[Icon] no lucide mapping for "${name}" — falling back to Ionicons. Add it to src/components/ui/Icon.tsx.`
      )
    }
    return (
      <Ionicons
        name={name as keyof typeof Ionicons.glyphMap}
        size={size}
        color={color}
        style={style}
        {...rest}
      />
    )
  }

  return (
    <Lucide
      size={size}
      color={color}
      fill={FILLED.has(name) ? color : "none"}
      style={style as StyleProp<ViewStyle>}
      {...rest}
    />
  )
}

export default Icon
