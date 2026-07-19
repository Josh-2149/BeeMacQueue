import React from 'react';
import { 
  Storefront,
  Envelope,
  Lock,
  ArrowRight,
  GoogleLogo,
  FacebookLogo,
  User,
  Eye,
  EyeSlash,
  WarningCircle,
  Warning,
  UserCircle,
  CheckCircle,
  House,
  Ticket,
  Bell,
  User as UserIcon,
  ChartBar,
  MagnifyingGlass,
  X,
  XCircle,          // 🆕 ADD THIS
  PlusCircle,       // 🆕 ADD THIS
  Plus,
  Minus,
  Clock,
  MapPin,
  Phone,
  Star,
  Calendar,
  Check,
  Heart,
  ShoppingBag,
  Coffee,
  Pizza,
  Hamburger,
  GameController,
  Car,
  Bus,
  Train,
  Airplane,
  Globe,
  ShareNetwork,
  Gear,
  SignOut,
  CaretDown,
  CaretUp,
  Tag,
  Users,
  Queue,
  Shield,
  Pencil,
  Trash,
  Info,
  List,
  ArrowsClockwise,
  Target,
  CaretRight,
  Rocket,
  Crown,
  WarningOctagon,   // 🆕 ADD THIS (for priority badge)
} from 'phosphor-react-native';

console.log('🔵 PhosphorIcon component loaded');

const iconMap = {
  Storefront,
  Envelope,
  Lock,
  ArrowRight,
  GoogleLogo,
  FacebookLogo,
  User,
  Eye,
  EyeSlash,
  WarningCircle,
  Warning,
  UserCircle,
  CheckCircle,
  House,
  Ticket,
  Bell,
  UserIcon,
  ChartBar,
  MagnifyingGlass,
  X,
  XCircle,          // 🆕 ADD THIS
  PlusCircle,       // 🆕 ADD THIS
  Plus,
  Minus,
  Clock,
  MapPin,
  Phone,
  Star,
  Calendar,
  Check,
  Heart,
  ShoppingBag,
  Coffee,
  Pizza,
  Hamburger,
  GameController,
  Car,
  Bus,
  Train,
  Airplane,
  Globe,
  ShareNetwork,
  Gear,
  SignOut,
  CaretDown,
  CaretUp,
  Tag,
  Users,
  Queue,
  Shield,
  Pencil,
  Trash,
  Info,
  List,
  ArrowsClockwise,
  Target,
  CaretRight,
  Rocket,
  Crown,
  WarningOctagon,   // 🆕 ADD THIS
} as const;

type IconName = keyof typeof iconMap;

interface PhosphorIconProps {
  icon: IconName | string;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  style?: any;
}

export function PhosphorIcon({ 
  icon, 
  size = 24, 
  color = '#000000', 
  weight = 'regular',
  style 
}: PhosphorIconProps) {
  const IconComponent = iconMap[icon as IconName];
  
  if (!IconComponent) {
    console.warn(`⚠️ Icon "${icon}" not found in Phosphor icon map`);
    return null;
  }

  return (
    <IconComponent 
      size={size} 
      color={color} 
      weight={weight} 
      style={style} 
    />
  );
}

export default PhosphorIcon;