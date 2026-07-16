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
  UserCircle,
  CheckCircle,
  House,
  Ticket,
  Bell,
  User as UserIcon,
  ChartBar,
  MagnifyingGlass,
  X,
  Plus,
  Minus,
  Clock,
  MapPin,
  Phone,
  Star,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Coffee,
  Pizza,
  Hamburger,
  Beer,
  Music,
  Film,
  GameController,
  Wifi,
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
} from 'phosphor-react-native';

console.log('🔵 PhosphorIcon component loaded');

// Map of icon names to Phosphor components
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
  UserCircle,
  CheckCircle,
  House,
  Ticket,
  Bell,
  UserIcon,
  ChartBar,
  MagnifyingGlass,
  X,
  Plus,
  Minus,
  Clock,
  MapPin,
  Phone,
  Star,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Coffee,
  Pizza,
  Hamburger,
  Beer,
  Music,
  Film,
  GameController,
  Wifi,
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
  // Check if icon exists in map
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