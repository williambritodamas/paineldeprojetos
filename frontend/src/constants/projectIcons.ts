// Ícones disponíveis para os projetos.
// Cada item guarda o nome usado no banco (campo `icon`) e o componente lucide.

import {
  BarChart3,
  Bot,
  Box,
  Building2,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  Folder,
  Gamepad2,
  GitBranch,
  Globe,
  Home,
  Image,
  Layers,
  LayoutDashboard,
  Mail,
  Map,
  MessageSquare,
  Music,
  Palette,
  Rocket,
  Server,
  Settings,
  Shield,
  ShoppingCart,
  Terminal,
  Truck,
  Users,
  Video,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface IconeProjeto {
  nome: string;
  Componente: LucideIcon;
}

export const ICONES_DISPONIVEIS: IconeProjeto[] = [
  { nome: "folder", Componente: Folder },
  { nome: "globe", Componente: Globe },
  { nome: "server", Componente: Server },
  { nome: "database", Componente: Database },
  { nome: "rocket", Componente: Rocket },
  { nome: "code", Componente: Code },
  { nome: "terminal", Componente: Terminal },
  { nome: "layout-dashboard", Componente: LayoutDashboard },
  { nome: "settings", Componente: Settings },
  { nome: "users", Componente: Users },
  { nome: "bar-chart", Componente: BarChart3 },
  { nome: "shield", Componente: Shield },
  { nome: "zap", Componente: Zap },
  { nome: "box", Componente: Box },
  { nome: "bot", Componente: Bot },
  { nome: "cpu", Componente: Cpu },
  { nome: "wifi", Componente: Wifi },
  { nome: "cloud", Componente: Cloud },
  { nome: "layers", Componente: Layers },
  { nome: "palette", Componente: Palette },
  { nome: "mail", Componente: Mail },
  { nome: "file-text", Componente: FileText },
  { nome: "video", Componente: Video },
  { nome: "image", Componente: Image },
  { nome: "music", Componente: Music },
  { nome: "gamepad", Componente: Gamepad2 },
  { nome: "shopping-cart", Componente: ShoppingCart },
  { nome: "message-square", Componente: MessageSquare },
  { nome: "map", Componente: Map },
  { nome: "building", Componente: Building2 },
  { nome: "home", Componente: Home },
  { nome: "git-branch", Componente: GitBranch },
  { nome: "truck", Componente: Truck },
];

export const NOME_ICONE_PADRAO = "folder";

export const mapaIcones: Record<string, LucideIcon> = Object.fromEntries(
  ICONES_DISPONIVEIS.map((icone) => [icone.nome, icone.Componente])
);