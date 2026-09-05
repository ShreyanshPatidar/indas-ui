// Deep icon paths have no bundled types; treat each as a LucideIcon component.
declare module "lucide-react/dist/esm/icons/*" {
  import type { LucideIcon } from "@/lib/icons"
  const icon: LucideIcon
  export default icon
}
