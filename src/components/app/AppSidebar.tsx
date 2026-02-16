"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  MountainSnow,
  CalendarDays,
  Map,
  Users,
  MessageSquare,
  Shield,
  LifeBuoy,
  User,
  HeartHandshake,
  Search,
} from "lucide-react"
import Image from "next/image"

const menuItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/search-hike", label: "Trouver un circuit de rando", icon: Search },
  { href: "/events", label: "S'inscrire à une rando", icon: CalendarDays },
  { href: "/members", label: "Membres", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/forum", label: "Forum de discussion", icon: MessageSquare },
  {
    label: "Ressources",
    icon: Map,
    subItems: [
      { href: "/tourist-offices", label: "Offices de tourisme" },
      { href: "/links", label: "Liens utiles" },
      { href: "/calendar", label: "Calendrier" },
      { href: "/map", label: "Carte des départs" },
    ],
  },
  {
    label: "Communauté",
    icon: HeartHandshake,
    subItems: [
      { href: "/community/meetup", label: "Évènements Meetup" },
      { href: "/community/facebook", label: "Groupes Facebook" },
      { href: "/community/partners", label: "Partenaires" },
    ]
  },
]

const adminMenuItems = [
  { href: "/admin", label: "Administration", icon: Shield },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const logoUrl = "/icons/logo_Toulouse_Rando512.jpg";


  const isActive = (href: string, isSubItem = false) => {
    if (isSubItem) return pathname === href
    return pathname.startsWith(href) && (href !== "/dashboard" || pathname === "/dashboard")
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src={logoUrl} alt="Toulouse rando Logo" width={50} height={50} className="rounded-md" />
          <span className="text-xl font-bold text-sidebar-primary">Toulouse rando</span>
        </Link>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {menuItems.map((item) =>
          item.subItems ? (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
              <SidebarMenuSub>
                {item.subItems.map(sub => (
                    <SidebarMenuSubItem key={sub.href}>
                        <SidebarMenuSubButton asChild isActive={isActive(sub.href, true)}>
                            <Link href={sub.href}>{sub.label}</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>

      <SidebarMenu>
        {adminMenuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Aide" isActive={isActive('/help')}>
              <Link href="/help">
                <LifeBuoy />
                <span>Aide</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profil et paramètres" isActive={isActive('/profile')}>
              <Link href="/profile">
                <User />
                <span>Profil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
