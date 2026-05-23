import { getServerSession } from "next-auth/next"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

export const getServerAuthSession = () => {
  return getServerSession(authOptions)
}

// Export auth options for use in other parts of the app
export { authOptions }